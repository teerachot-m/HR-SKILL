-- ============================================================
-- Migration v2 — เพิ่ม columns ใหม่ใน employees + view + RPC
-- รันถ้าคุณรัน 01_schema.sql เวอร์ชันแรกไปแล้ว
-- ปลอดภัย: ใช้ IF NOT EXISTS / OR REPLACE ทั้งหมด — รันซ้ำได้
-- ============================================================

-- ── เพิ่ม columns ที่ขาด ──────────────────────────────────────
alter table public.employees add column if not exists title_th         text;
alter table public.employees add column if not exists title_en         text;
alter table public.employees add column if not exists first_name_th    text;
alter table public.employees add column if not exists last_name_th     text;
alter table public.employees add column if not exists first_name_en    text;
alter table public.employees add column if not exists last_name_en     text;
alter table public.employees add column if not exists division         text;
alter table public.employees add column if not exists department       text;
alter table public.employees add column if not exists section          text;
alter table public.employees add column if not exists employee_grade   int;
alter table public.employees add column if not exists hire_date        date;
alter table public.employees add column if not exists employee_status  text default 'active';
alter table public.employees add column if not exists must_change_pin  boolean not null default true;

-- ── อัปเดต view ───────────────────────────────────────────────
drop view if exists public.latest_assessment;
create view public.latest_assessment as
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

-- ── เพิ่ม RPC: พนักงานเปลี่ยน PIN ตัวเอง ─────────────────────
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

-- ── เสร็จ ────────────────────────────────────────────────────
select 'migration v2 applied' as status;
