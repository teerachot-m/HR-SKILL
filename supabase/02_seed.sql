-- ============================================================
-- Seed Data — Skills Catalog (20 ตัว)
-- รันหลังจาก 01_schema.sql
-- ============================================================

insert into public.skills_catalog (key, name, description, category, sort_order) values
  ('rec',     'Recruitment & Selection',  'การสรรหาและคัดเลือกพนักงาน',  'hr',   1),
  ('pay',     'Payroll Management',       'การจัดการเงินเดือนและค่าตอบแทน','hr',   2),
  ('lnd',     'Learning & Development',   'การฝึกอบรมและพัฒนาบุคลากร',    'hr',   3),
  ('cnb',     'Compensation & Benefits',  'การออกแบบโครงสร้าง C&B',       'hr',   4),
  ('hris',    'HRIS Management',          'ระบบสารสนเทศ HR',              'hr',   5),
  ('er',      'Employee Relations',       'แรงงานสัมพันธ์',                'hr',   6),
  ('od',      'Organization Development', 'การพัฒนาองค์กรและวัฒนธรรม',     'hr',   7),
  ('hrstrat', 'HR Strategy & Planning',   'กลยุทธ์และแผนงาน HR',           'hr',   8),

  ('excel',   'Excel / Google Sheets',    'วิเคราะห์ข้อมูลด้วย Spreadsheet','dig', 1),
  ('pbi',     'Power BI / Data Viz',      'Dashboard และรายงานข้อมูล',     'dig',  2),
  ('gws',     'Google Workspace',         'Docs, Slides, Meet, Drive',     'dig',  3),
  ('ai',      'AI & Automation Tools',    'ChatGPT, Claude, Zapier, n8n',  'dig',  4),
  ('hra',     'HR Analytics',             'การวิเคราะห์ข้อมูล HR เชิงลึก', 'dig',  5),
  ('sys',     'HR Software Systems',      'SAP, Workday, Tiger Soft',      'dig',  6),

  ('comm',    'Communication',            'การสื่อสารทั้งพูดและเขียน',     'soft', 1),
  ('lead',    'Leadership',               'การนำทีมและสร้างแรงจูงใจ',      'soft', 2),
  ('pm',      'Project Management',       'การบริหารจัดการโครงการ',        'soft', 3),
  ('ana',     'Analytical Thinking',      'การคิดวิเคราะห์และแก้ปัญหา',    'soft', 4),
  ('team',    'Teamwork & Collaboration', 'การทำงานเป็นทีม',               'soft', 5),
  ('adapt',   'Adaptability',             'ความยืดหยุ่นและการปรับตัว',     'soft', 6)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  sort_order = excluded.sort_order;
