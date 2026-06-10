-- ============================================================
-- Seed: HR Employees ทั้ง 40 คน (ข้อมูลจริง)
-- PIN เริ่มต้น: 000000 ทุกคน + must_change_pin = true
-- Admin: 05242 (ทมิตา) + 06863 (ธีรโชติ)
-- ============================================================

-- ลบ demo เดิม (ถ้ามี)
delete from public.assessments
  where employee_id in (select id from public.employees where emp_code in ('HR001','HR002','HR003','HR004','HR005'));
delete from public.employees where emp_code in ('HR001','HR002','HR003','HR004','HR005');

-- ── Helper: map grade → position_level ──────────────────────
-- grade 2-4 → 4 (Director/Sr.Mgr), 5 → 3 (Manager), 6-7 → 2 (Supv/AM), 8 → 1 (Senior), 9 → 0 (Staff)
create or replace function _grade_to_poslv(g int) returns int language sql immutable as $$
  select case
    when g between 2 and 4 then 4
    when g = 5 then 3
    when g in (6,7) then 2
    when g = 8 then 1
    else 0
  end;
$$;

-- ── 40 พนักงาน HR ───────────────────────────────────────────
insert into public.employees (
  emp_code, name, nick, title_th, title_en, first_name_th, last_name_th, first_name_en, last_name_en,
  position, function, division, department, section,
  employee_grade, position_level, experience_years, hire_date, employee_status,
  is_admin, is_active, must_change_pin
) values
-- Director / Corporate HR
('05242','ทมิตา จงสวัสดิ์วรกุล','ทมิตา','น.ส.','Miss','ทมิตา','จงสวัสดิ์วรกุล','Thamita','Chongswatvorakul','Director of Corporate Human Resources','Corporate Human Resources','Corporate Human Resources Department','Corporate Human Resources','Corporate Human Resources',2,_grade_to_poslv(2),extract(year from age(current_date,date '2015-01-01'))::int,date '2015-01-01','active',true,true,true),
('06388','โสภณ มีสกุล','โสภณ','นาย','Mr.','โสภณ','มีสกุล','Sophon','Meesakun','Assistant Director of Human Resources','Corporate Human Resources','Corporate Human Resources Department','Corporate Human Resources','Corporate Human Resources',3,_grade_to_poslv(3),extract(year from age(current_date,date '2017-01-04'))::int,date '2017-01-04','active',false,true,true),

-- HR Business Solutions
('06686','ศิริกัญญา ประเสริฐศรี','ศิริกัญญา','น.ส.','Miss','ศิริกัญญา','ประเสริฐศรี','Sirikanya','Prasertsri','Senior Manager - HR Business Solutions','HR Business Solutions','Corporate Human Resources Department','HR Business Solutions','HR Business Solutions',4,_grade_to_poslv(4),extract(year from age(current_date,date '2018-01-03'))::int,date '2018-01-03','active',false,true,true),
('06801','ชัญญา ธูปบูชา','ชัญญา','น.ส.','Miss','ชัญญา','ธูปบูชา','Chanya','Toopbucha','Assistant Manager - HR Business Solutions','HR Business Solutions','Corporate Human Resources Department','HR Business Solutions','HR Business Solutions',6,_grade_to_poslv(6),extract(year from age(current_date,date '2018-08-20'))::int,date '2018-08-20','active',false,true,true),
('07511','รวิวรรณ ทัศนีย์รัตน์','รวิวรรณ','น.ส.','Miss','รวิวรรณ','ทัศนีย์รัตน์','Rawiwan','Tassaneratana','HR Business Solutions Manager','HR Business Solutions','Corporate Human Resources Department','HR Business Solutions','HR Business Solutions',5,_grade_to_poslv(5),extract(year from age(current_date,date '2021-05-17'))::int,date '2021-05-17','active',false,true,true),
('07765','รณชัย พูนศิริ','รณชัย','นาย','Mr.','รณชัย','พูนศิริ','Ronnachai','Poonsiri','HR Business Solutions Manager','HR Business Solutions','Corporate Human Resources Department','HR Business Solutions','HR Business Solutions',5,_grade_to_poslv(5),extract(year from age(current_date,date '2022-04-01'))::int,date '2022-04-01','active',false,true,true),
('07861','จิราวรรณ ชยางกูร ณ อยุธยา','จิราวรรณ','น.ส.','Miss','จิราวรรณ','ชยางกูร ณ อยุธยา','Jirawan','Chayangkun Na Ayuthaya','HR Business Solutions Executive','HR Business Solutions','Corporate Human Resources Department','HR Business Solutions','HR Business Solutions',8,_grade_to_poslv(8),extract(year from age(current_date,date '2021-03-01'))::int,date '2021-03-01','active',false,true,true),
('07912','วรวรรณ บรรลือพืช','วรวรรณ','น.ส.','Miss','วรวรรณ','บรรลือพืช','Worawan','Banluephuet','HR Business Solutions Supervisor','HR Business Solutions','Corporate Human Resources Department','HR Business Solutions','HR Business Solutions',7,_grade_to_poslv(7),extract(year from age(current_date,date '2022-08-01'))::int,date '2022-08-01','active',false,true,true),
('08540','ศศิภา ถิ่นบุญโชติ','ศศิภา','น.ส.','Miss','ศศิภา','ถิ่นบุญโชติ','Sasipa','Tinboonchote','HR Business Solutions Executive','HR Business Solutions','Corporate Human Resources Department','HR Business Solutions','HR Business Solutions',8,_grade_to_poslv(8),extract(year from age(current_date,date '2023-05-02'))::int,date '2023-05-02','active',false,true,true),
('08658','เกรียงไกร จ่าศาล','เกรียงไกร','นาย','Mr.','เกรียงไกร','จ่าศาล','Kreangkrai','Jasarn','HR Business Solutions Supervisor','HR Business Solutions','Corporate Human Resources Department','HR Business Solutions','HR Business Solutions',7,_grade_to_poslv(7),extract(year from age(current_date,date '2023-09-01'))::int,date '2023-09-01','active',false,true,true),

-- People Development (L&D)
('07965','เนตรชนก นิยมรัฐ','เนตรชนก','น.ส.','Miss','เนตรชนก','นิยมรัฐ','Netchanok','Niyomraht','Learning & Development Manager','People Development','Corporate Human Resources Department','People Development','People Development',5,_grade_to_poslv(5),extract(year from age(current_date,date '2022-10-03'))::int,date '2022-10-03','active',false,true,true),
('08521','พิมพิศา พรหมสาขา ณ สกลนคร','พิมพิศา','น.ส.','Miss','พิมพิศา','พรหมสาขา ณ สกลนคร','Pimpisa','Promsakha Na Sakolnakorn','People Development Specialist','People Development','Corporate Human Resources Department','People Development','People Development',7,_grade_to_poslv(7),extract(year from age(current_date,date '2023-04-17'))::int,date '2023-04-17','active',false,true,true),
('08984','ปิยะษาณ์ จงวัฒนไพบูลย์','ปิยะษาณ์','นาย','Mr.','ปิยะษาณ์','จงวัฒนไพบูลย์','Piyasa','Jongwattanapaiboon','People Development Specialist','People Development','Corporate Human Resources Department','People Development','People Development',8,_grade_to_poslv(8),extract(year from age(current_date,date '2024-08-16'))::int,date '2024-08-16','active',false,true,true),
('09422','ขจรพงศ์ เตือนวีระเดช','ขจรพงศ์','นาย','Mr.','ขจรพงศ์','เตือนวีระเดช','Khajonpong','Tuenweeradet','People Development Specialist','People Development','Corporate Human Resources Department','People Development','People Development',6,_grade_to_poslv(6),extract(year from age(current_date,date '2025-12-01'))::int,date '2025-12-01','active',false,true,true),

-- Total Rewards Management (Payroll & C&B)
('07523','นภัสสร กลิ่นหอม','นภัสสร','น.ส.','Miss','นภัสสร','กลิ่นหอม','Napassorn','Klinhom','Payroll Executive','Total Rewards Management','Corporate Human Resources Department','Total Rewards Management','Total Rewards Management',8,_grade_to_poslv(8),extract(year from age(current_date,date '2021-06-01'))::int,date '2021-06-01','active',false,true,true),
('07966','ธิติมา พวงระย้า','ธิติมา','น.ส.','Miss','ธิติมา','พวงระย้า','Thitima','Pongraya','Benefits Executive','Total Rewards Management','Corporate Human Resources Department','Total Rewards Management','Total Rewards Management',8,_grade_to_poslv(8),extract(year from age(current_date,date '2022-09-01'))::int,date '2022-09-01','active',false,true,true),
('08532','อมรวรรณ คำอ้วน','อมรวรรณ','น.ส.','Miss','อมรวรรณ','คำอ้วน','Amornwan','Kum-oun','Payroll Executive','Total Rewards Management','Corporate Human Resources Department','Total Rewards Management','Total Rewards Management',8,_grade_to_poslv(8),extract(year from age(current_date,date '2023-05-02'))::int,date '2023-05-02','active',false,true,true),
('09096','วนิดา เรืองไกรศิลป์','วนิดา','น.ส.','Miss','วนิดา','เรืองไกรศิลป์','Wanida','Ruengkraisin','Assistant Manager - Total Rewards Management','Total Rewards Management','Corporate Human Resources Department','Total Rewards Management','Total Rewards Management',6,_grade_to_poslv(6),extract(year from age(current_date,date '2025-02-17'))::int,date '2025-02-17','active',false,true,true),
('09178','ศศิธร ดำปาน','ศศิธร','น.ส.','Miss','ศศิธร','ดำปาน','Sasitorn','Dampan','Benefits Executive','Total Rewards Management','Corporate Human Resources Department','Total Rewards Management','Total Rewards Management',8,_grade_to_poslv(8),extract(year from age(current_date,date '2025-07-01'))::int,date '2025-07-01','active',false,true,true),
('09514','พิมพ์พรรณ พูลทรัพย์','พิมพ์พรรณ','น.ส.','Miss','พิมพ์พรรณ','พูลทรัพย์','Phimphan','Phoonsap','Payroll Executive','Total Rewards Management','Corporate Human Resources Department','Total Rewards Management','Total Rewards Management',8,_grade_to_poslv(8),extract(year from age(current_date,date '2026-04-01'))::int,date '2026-04-01','probation',false,true,true),

-- HR Shared Service
('03532','ณัฐพิชญ์ ณัฐภัคสุพัชญา','ณัฐพิชญ์','น.ส.','Miss','ณัฐพิชญ์','ณัฐภัคสุพัชญา','Natthaphit','Natpaksupatchaya','Casual Management Support Supervisor','HR Shared Service','Corporate Human Resources Department','HR Shared Service','HR Shared Service',7,_grade_to_poslv(7),extract(year from age(current_date,date '2012-07-24'))::int,date '2012-07-24','active',false,true,true),
('07606','สหกมล โอบอ้อม','สหกมล','นาย','Mr.','สหกมล','โอบอ้อม','Sahakamon','Orb-orm','HR Shared Service Supervisor','HR Shared Service','Corporate Human Resources Department','HR Shared Service','HR Shared Service',7,_grade_to_poslv(7),extract(year from age(current_date,date '2021-12-01'))::int,date '2021-12-01','active',false,true,true),
('07607','วัฒนา ชากำนัน','วัฒนา','นาย','Mr.','วัฒนา','ชากำนัน','Watana','Chakamnan','HR Shared Service Executive','HR Shared Service','Corporate Human Resources Department','HR Shared Service','HR Shared Service',8,_grade_to_poslv(8),extract(year from age(current_date,date '2021-12-16'))::int,date '2021-12-16','active',false,true,true),
('07636','วัชระ สะบก','วัชระ','นาย','Mr.','วัชระ','สะบก','Watchara','Sabok','Assistant Manager - HR Shared Service','HR Shared Service','Corporate Human Resources Department','HR Shared Service','HR Shared Service',6,_grade_to_poslv(6),extract(year from age(current_date,date '2022-01-04'))::int,date '2022-01-04','active',false,true,true),
('07637','ชยย์ณัฐ ธรรมิกะกุล','ชยย์ณัฐ','นาย','Mr.','ชยย์ณัฐ','ธรรมิกะกุล','Chayanat','Thammikakul','HR Shared Service Executive','HR Shared Service','Corporate Human Resources Department','HR Shared Service','HR Shared Service',8,_grade_to_poslv(8),extract(year from age(current_date,date '2022-01-04'))::int,date '2022-01-04','active',false,true,true),
('08110','อนรรฆพร ชนะความ','อนรรฆพร','น.ส.','Miss','อนรรฆพร','ชนะความ','Anakkaporn','Chanakwam','Senior Manager - HR Shared Service','HR Shared Service','Corporate Human Resources Department','HR Shared Service','HR Shared Service',4,_grade_to_poslv(4),extract(year from age(current_date,date '2017-10-16'))::int,date '2017-10-16','active',false,true,true),
('09108','ณัฐกวินป์ คูหา','ณัฐกวินป์','นาย','Mr.','ณัฐกวินป์','คูหา','Natkawinp','Khuha','HR Shared Service Supervisor','HR Shared Service','Corporate Human Resources Department','HR Shared Service','HR Shared Service',7,_grade_to_poslv(7),extract(year from age(current_date,date '2025-03-03'))::int,date '2025-03-03','active',false,true,true),

-- People Experience
('06640','สุณิชา เจริญศักดิ์','สุณิชา','น.ส.','Miss','สุณิชา','เจริญศักดิ์','Sunicha','Charoensak','People Experience Designer','People Experience','Corporate Human Resources Department','People Experience','People Experience',7,_grade_to_poslv(7),extract(year from age(current_date,date '2017-08-15'))::int,date '2017-08-15','active',false,true,true),
('07032','รวิพล สุธราพันธ์','รวิพล','นาย','Mr.','รวิพล','สุธราพันธ์','Rawipol','Sutharaphan','People Content Editor','People Experience','Corporate Human Resources Department','People Experience','People Experience',7,_grade_to_poslv(7),extract(year from age(current_date,date '2019-05-02'))::int,date '2019-05-02','active',false,true,true),
('07807','เกริกพล มะลิโพธิ์กลาง','เกริกพล','นาย','Mr.','เกริกพล','มะลิโพธิ์กลาง','Kroekpol','Maliphoklang','People Content Editor','People Experience','Corporate Human Resources Department','People Experience','People Experience',8,_grade_to_poslv(8),extract(year from age(current_date,date '2021-07-01'))::int,date '2021-07-01','active',false,true,true),
('07946','ลักษณพร หมายชัย','ลักษณพร','น.ส.','Miss','ลักษณพร','หมายชัย','Laksanaporn','Mychai','People Content Editor','People Experience','Corporate Human Resources Department','People Experience','People Experience',8,_grade_to_poslv(8),extract(year from age(current_date,date '2022-08-16'))::int,date '2022-08-16','active',false,true,true),
('08803','ยศพล พุ่มมูล','ยศพล','นาย','Mr.','ยศพล','พุ่มมูล','Yotsapol','Pummool','People Content Editor','People Experience','Corporate Human Resources Department','People Experience','People Experience',9,_grade_to_poslv(9),extract(year from age(current_date,date '2023-11-01'))::int,date '2023-11-01','active',false,true,true),
('08862','ธันยพร ธรรมวิชิต','ธันยพร','น.ส.','Miss','ธันยพร','ธรรมวิชิต','Thanyaphon','Thammawichit','People Content Editor','People Experience','Corporate Human Resources Department','People Experience','People Experience',9,_grade_to_poslv(9),extract(year from age(current_date,date '2024-04-01'))::int,date '2024-04-01','active',false,true,true),
('08863','ปิยธิดา คุณากรประทีป','ปิยธิดา','น.ส.','Miss','ปิยธิดา','คุณากรประทีป','Piyathida','Kunakornprateep','Project Coordinator','People Experience','Corporate Human Resources Department','People Experience','People Experience',9,_grade_to_poslv(9),extract(year from age(current_date,date '2024-04-01'))::int,date '2024-04-01','active',false,true,true),

-- People Analytic (HRIS & Analytics)
('06863','ธีรโชติ เงินประเสริฐศิริ','ธีรโชติ','นาย','Mr.','ธีรโชติ','เงินประเสริฐศิริ','Teerachot','Ngernprasertsiri','Assistant Manager - Data Analyst','People Analytic','Corporate Human Resources Department','People Analytic','People Analytic',6,_grade_to_poslv(6),extract(year from age(current_date,date '2018-11-15'))::int,date '2018-11-15','active',true,true,true),
('08417','สิมิลัน วิบุญมา','สิมิลัน','น.ส.','Miss','สิมิลัน','วิบุญมา','Similan','Whiboonma','People Data Executive','People Analytic','Corporate Human Resources Department','People Analytic','People Analytic',8,_grade_to_poslv(8),extract(year from age(current_date,date '2022-09-16'))::int,date '2022-09-16','active',false,true,true),
('08418','ฮาบีบะห์ หาบยุโซะ','ฮาบีบะห์','น.ส.','Miss','ฮาบีบะห์','หาบยุโซะ','Habeebah','Hab-u-soh','People Data Executive','People Analytic','Corporate Human Resources Department','People Analytic','People Analytic',8,_grade_to_poslv(8),extract(year from age(current_date,date '2022-05-17'))::int,date '2022-05-17','active',false,true,true),
('08902','คณพศ บุญทัน','คณพศ','นาย','Mr.','คณพศ','บุญทัน','Kanapoj','Boontan','People System Coordinator','People Analytic','Corporate Human Resources Department','People Analytic','People Analytic',8,_grade_to_poslv(8),extract(year from age(current_date,date '2022-11-01'))::int,date '2022-11-01','active',false,true,true),
('09148','รัชชานนท์ ชูเกียรติเถกิง','รัชชานนท์','นาย','Mr.','รัชชานนท์','ชูเกียรติเถกิง','Ratchanon','Chukiattakerng','People Data Officer','People Analytic','Corporate Human Resources Department','People Analytic','People Analytic',9,_grade_to_poslv(9),extract(year from age(current_date,date '2025-05-02'))::int,date '2025-05-02','active',false,true,true),

-- Legal
('09205','ธงชัย พนมศิลป์','ธงชัย','นาย','Mr.','ธงชัย','พนมศิลป์','Thongchai','Panomsin','Legal Manager','Legal','Corporate Human Resources Department','Legal','Legal',5,_grade_to_poslv(5),extract(year from age(current_date,date '2025-07-16'))::int,date '2025-07-16','active',false,true,true)

on conflict (emp_code) do update set
  name = excluded.name,
  position = excluded.position,
  function = excluded.function,
  department = excluded.department,
  employee_grade = excluded.employee_grade,
  position_level = excluded.position_level,
  hire_date = excluded.hire_date,
  employee_status = excluded.employee_status,
  is_admin = excluded.is_admin;

-- ── สร้าง auth user + PIN 000000 ให้ทุกคน ──────────────────
do $$
declare
  emp record;
  default_pin text := '000000';
  v_user_id uuid;
  v_email text;
begin
  for emp in select emp_code from public.employees where auth_user_id is null loop
    v_email := lower(emp.emp_code) || '@hr.local';
    select id into v_user_id from auth.users where email = v_email;
    if v_user_id is null then
      insert into auth.users (id, email, encrypted_password, email_confirmed_at,
                              raw_app_meta_data, raw_user_meta_data, aud, role)
      values (
        gen_random_uuid(), v_email, crypt(default_pin, gen_salt('bf')), now(),
        jsonb_build_object('provider','email','providers',array['email']),
        jsonb_build_object('emp_code', emp.emp_code),
        'authenticated', 'authenticated'
      )
      returning id into v_user_id;
    end if;
    update public.employees set auth_user_id = v_user_id where emp_code = emp.emp_code;
  end loop;
end $$;

drop function if exists _grade_to_poslv(int);

-- ── ตรวจสอบ ─────────────────────────────────────────────────
select
  (select count(*) from public.employees) as total_employees,
  (select count(*) from public.employees where is_admin) as admins,
  (select count(*) from public.employees where employee_status='probation') as on_probation,
  (select count(*) from auth.users where email like '%@hr.local') as auth_accounts;
