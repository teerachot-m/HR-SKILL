-- ============================================================
-- Corp.HR KM System — Supabase Schema
-- รันใน: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ============================================================
-- 1) skills_catalog — รายการ skill ทั้งหมด (อ่านอย่างเดียว)
-- ============================================================
create table if not exists public.skills_catalog (
  key          text primary key,                       -- 'rec', 'pay', ...
  name         text not null,                          -- 'Recruitment & Selection'
  description  text,
  category     text not null check (category in ('hr','dig','soft')),
  sort_order   int  not null default 0
);

-- ============================================================
-- 2) employees — รายชื่อพนักงาน HR
--    1 record = 1 พนักงาน (รหัสพนักงาน unique)
--    auth_user_id เชื่อมกับ auth.users ของ Supabase Auth
-- ============================================================
create table if not exists public.employees (
  id                uuid primary key default gen_random_uuid(),
  auth_user_id      uuid unique references auth.users(id) on delete set null,
  emp_code          text unique not null,              -- รหัสพนักงาน (ใช้ login)
  name              text not null,                     -- ชื่อ-นามสกุล
  nick              text,                              -- ชื่อเล่น
  position          text,                              -- ตำแหน่ง
  function          text,                              -- 'Recruitment' / 'L&D' / ...
  experience_years  int default 0,
  position_level    int check (position_level between 0 and 4),
  email             text,
  title_th          text,                              -- คำนำหน้า ไทย (นาย/น.ส.)
  title_en          text,                              -- คำนำหน้า อังกฤษ (Mr./Miss)
  first_name_th     text,
  last_name_th      text,
  first_name_en     text,
  last_name_en      text,
  division          text,                              -- ฝ่าย: Corporate HR Dept
  department        text,                              -- แผนก: HR Business Solutions / People Dev / ...
  section           text,                              -- ส่วน
  employee_grade    int,                               -- ระดับองค์กร 1-9 (กรอกตาม HRIS)
  hire_date         date,
  employee_status   text default 'active',             -- 'active' / 'probation' / 'resigned'
  is_admin          boolean not null default false,    -- admin = แก้พนักงาน/ดูทุกคน
  is_active         boolean not null default true,
  must_change_pin   boolean not null default true,     -- บังคับเปลี่ยน PIN ครั้งแรก
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists employees_emp_code_idx on public.employees(emp_code);
create index if not exists employees_function_idx on public.employees(function);

-- ============================================================
-- 3) assessments — การประเมินแต่ละครั้ง
--    1 พนักงานมีหลาย assessment ตามวันที่
-- ============================================================
create table if not exists public.assessments (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references public.employees(id) on delete cascade,
  assessment_date  date not null default current_date,
  skills           jsonb not null default '{}'::jsonb, -- {rec:5, pay:3, ...}
  justifications   jsonb not null default '{}'::jsonb, -- {rec:'...', pay:'...'}
  qualitative      jsonb not null default '{}'::jsonb, -- {hr:{q1,q2,q3}, dig:{...}, soft:{...}}
  created_by       uuid references public.employees(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists assessments_emp_idx on public.assessments(employee_id, assessment_date desc);

-- View ที่ join ข้อมูลล่าสุดของพนักงานแต่ละคน (ใช้แสดงตารางหลัก)
create or replace view public.latest_assessment as
select distinct on (e.id)
  e.id                as employee_id,
  e.emp_code,
  e.name,
  e.nick,
  e.position,
  e.function,
  e.department,
  e.experience_years,
  e.position_level,
  e.employee_grade,
  e.employee_status,
  a.id                as assessment_id,
  a.assessment_date,
  a.skills,
  a.justifications,
  a.qualitative
from public.employees e
left join public.assessments a on a.employee_id = e.id
where e.is_active = true
order by e.id, a.assessment_date desc nulls last, a.created_at desc nulls last;

-- ============================================================
-- 4) Trigger: updated_at อัตโนมัติ
-- ============================================================
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists employees_touch on public.employees;
create trigger employees_touch before update on public.employees
  for each row execute function public.tg_touch_updated_at();

drop trigger if exists assessments_touch on public.assessments;
create trigger assessments_touch before update on public.assessments
  for each row execute function public.tg_touch_updated_at();

-- ============================================================
-- 5) Helper: ดึง employee record ของ user ที่ login อยู่
-- ============================================================
create or replace function public.current_employee()
returns public.employees language sql stable security definer as $$
  select * from public.employees where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select coalesce((select is_admin from public.employees where auth_user_id = auth.uid()), false);
$$;

-- ============================================================
-- 6) RPC: สร้าง/รีเซ็ต PIN ให้พนักงาน (admin เท่านั้น)
--    สร้าง auth user ด้วย email = {emp_code}@hr.local + password = PIN
-- ============================================================
create or replace function public.admin_set_pin(p_emp_code text, p_pin text)
returns json language plpgsql security definer as $$
declare
  v_email text;
  v_user_id uuid;
  v_emp_id uuid;
begin
  -- ตรวจ admin
  if not public.is_admin() then
    raise exception 'forbidden: admin only';
  end if;
  -- ตรวจ PIN รูปแบบ
  if p_pin !~ '^[0-9]{6}$' then
    raise exception 'pin must be 6 digits';
  end if;

  select id into v_emp_id from public.employees where emp_code = p_emp_code;
  if v_emp_id is null then
    raise exception 'employee not found: %', p_emp_code;
  end if;

  v_email := lower(p_emp_code) || '@hr.local';

  -- ถ้ามี auth user แล้ว → update password; ถ้ายัง → ให้ admin สร้างใหม่ทาง dashboard/SQL
  select id into v_user_id from auth.users where email = v_email;
  if v_user_id is null then
    -- สร้าง user ใหม่ผ่าน auth schema (ใช้ได้ใน security definer)
    insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
    values (
      gen_random_uuid(),
      v_email,
      crypt(p_pin, gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers',array['email']),
      jsonb_build_object('emp_code', p_emp_code),
      'authenticated',
      'authenticated'
    )
    returning id into v_user_id;
  else
    update auth.users
      set encrypted_password = crypt(p_pin, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = v_user_id;
  end if;

  update public.employees set auth_user_id = v_user_id where id = v_emp_id;
  return json_build_object('ok', true, 'emp_code', p_emp_code, 'email', v_email);
end $$;

-- ============================================================
-- 6.5) RPC: พนักงานเปลี่ยน PIN ตัวเอง
-- ============================================================
create or replace function public.change_my_pin(p_new_pin text)
returns json language plpgsql security definer as $$
declare
  v_uid uuid := auth.uid();
  v_emp_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_new_pin !~ '^[0-9]{6}$' then
    raise exception 'pin must be 6 digits';
  end if;
  -- ห้ามตั้ง PIN ที่อ่อนเกินไป
  if p_new_pin in ('000000','111111','222222','333333','444444','555555',
                   '666666','777777','888888','999999','123456','654321') then
    raise exception 'pin too weak — please choose a less obvious PIN';
  end if;

  update auth.users
    set encrypted_password = crypt(p_new_pin, gen_salt('bf'))
    where id = v_uid;

  update public.employees
    set must_change_pin = false
    where auth_user_id = v_uid
    returning id into v_emp_id;

  return json_build_object('ok', true);
end $$;

-- ============================================================
-- 7) Row Level Security
-- ============================================================
alter table public.employees      enable row level security;
alter table public.assessments    enable row level security;
alter table public.skills_catalog enable row level security;

-- skills_catalog: ทุกคนที่ login อ่านได้
drop policy if exists skills_read on public.skills_catalog;
create policy skills_read on public.skills_catalog
  for select to authenticated using (true);

-- employees:
--   - admin ดูได้ทุกคน + แก้ไขได้ทุกคน
--   - ทุกคน อ่านได้ (เพื่อใช้แสดงในระบบ KM)
--   - แก้ตัวเองเท่านั้น
drop policy if exists employees_read on public.employees;
create policy employees_read on public.employees
  for select to authenticated using (true);

drop policy if exists employees_update_self on public.employees;
create policy employees_update_self on public.employees
  for update to authenticated
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists employees_admin_all on public.employees;
create policy employees_admin_all on public.employees
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- assessments:
--   - ทุกคน อ่านได้ (เพื่อ benchmark)
--   - เขียน/แก้: เจ้าของ assessment หรือ admin
drop policy if exists assessments_read on public.assessments;
create policy assessments_read on public.assessments
  for select to authenticated using (true);

drop policy if exists assessments_write_self on public.assessments;
create policy assessments_write_self on public.assessments
  for all to authenticated
  using (
    public.is_admin() or
    employee_id = (select id from public.employees where auth_user_id = auth.uid())
  )
  with check (
    public.is_admin() or
    employee_id = (select id from public.employees where auth_user_id = auth.uid())
  );

-- ============================================================
-- เสร็จ — รัน 02_seed.sql ต่อเพื่อใส่ skills catalog + demo
-- ============================================================
