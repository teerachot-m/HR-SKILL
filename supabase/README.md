# Corp.HR KM System — Supabase Setup

ระบบประเมินทักษะ HR ที่ย้ายจาก `localStorage` + Google Sheets → Supabase
รองรับ login ด้วย **รหัสพนักงาน + PIN 6 หลัก**

---

## 📁 โครงสร้างไฟล์

```
HR-SKILL/
├── index.html                   ← หน้าเว็บหลัก (พร้อม login + change PIN)
├── supabase/
│   ├── 01_schema.sql            ← tables + RLS + RPC (admin_set_pin, change_my_pin)
│   ├── 02_seed.sql              ← skills catalog (20 ตัว)
│   └── 03_seed_employees.sql    ← พนักงาน HR จริง 40 คน + auth + PIN 000000
└── README.md
```

---

## 🚀 ขั้นตอนติดตั้ง (ครั้งเดียว)

### 1) รัน SQL ใน Supabase (เรียงตามลำดับ)

1. เปิด Supabase Dashboard → **SQL Editor** → New query
2. รัน **`01_schema.sql`** → tables + RLS + RPC
3. รัน **`02_seed.sql`** → skills catalog 20 ตัว
4. รัน **`03_seed_employees.sql`** → พนักงานจริง 40 คน + auth + PIN `000000`

หลัง 03 รันเสร็จควรเห็น:
```
total_employees | admins | on_probation | auth_accounts
       40       |   2    |      1       |     40
```

### 2) ปิด email confirmation

Supabase Dashboard → **Authentication** → **Providers** → Email
- ปิด **Confirm email** (เพราะเราใช้รหัสพนักงาน ไม่มี email จริง)

### 3) ใส่ค่า Supabase ใน HTML

เปิด `index.html` หาบรรทัดบนสุด:

```html
window.SUPABASE_URL  = 'https://YOUR-PROJECT.supabase.co';
window.SUPABASE_ANON = 'YOUR-ANON-PUBLIC-KEY';
```

แทนที่ด้วยค่าจาก **Project Settings → API**:
- Project URL
- `anon` public key (ไม่ใช่ service_role!)

### 4) เปิดหน้าเว็บ

```bash
open index.html
```

หรือ host ที่ไหนก็ได้ — GitHub Pages, Netlify, Vercel ฯลฯ

---

## 🔐 Login

**PIN เริ่มต้น = `000000` ทุกคน** — ระบบจะบังคับให้ตั้ง PIN ใหม่ทันทีหลัง login ครั้งแรก
ห้ามใช้ PIN ที่อ่อน เช่น `000000`, `123456`, `111111`, `654321` (ระบบจะ reject)

| รหัสพนักงาน | ชื่อ | ตำแหน่ง | สิทธิ์ |
|---|---|---|---|
| 05242 | ทมิตา จงสวัสดิ์วรกุล | Director of Corporate HR | **Admin** |
| 06863 | ธีรโชติ เงินประเสริฐศิริ | Assistant Manager - Data Analyst | **Admin** |
| (อื่นๆ 38 คน) | — | — | User |

### เพิ่มพนักงานใหม่ (Admin เท่านั้น)

ใน Supabase SQL Editor:

```sql
-- 1) เพิ่มพนักงาน
insert into public.employees (emp_code, name, nick, position, function, experience_years, position_level)
values ('HR006', 'ชื่อ-นามสกุล', 'ชื่อเล่น', 'HR Officer', 'Recruitment', 2, 0);

-- 2) ตั้ง PIN (admin เท่านั้น)
select public.admin_set_pin('HR006', '654321');
```

### รีเซ็ต PIN ของพนักงาน (Admin)

```sql
-- รีเซ็ตเป็น 000000 + บังคับเปลี่ยนใหม่
select public.admin_set_pin('07523', '000000');
update public.employees set must_change_pin = true where emp_code = '07523';
```

### พนักงานเปลี่ยน PIN ตัวเอง

ใช้ RPC `change_my_pin()` — เรียกจาก client หลัง login:

```js
await sb.rpc('change_my_pin', {p_new_pin: '482719'});
```

ระบบจะ reject PIN ที่เดาง่าย (000000, 123456, 111111, ฯลฯ)

---

## 🗂 โครงสร้างข้อมูล

### `employees`
- `emp_code` (unique) — ใช้ login
- `name`, `nick`, `position`, `function`
- `experience_years`, `position_level` (0–4)
- `is_admin` — สิทธิ์เพิ่ม/แก้พนักงาน
- `auth_user_id` — เชื่อมกับ Supabase Auth

### `assessments`
- เก็บ **ทุกครั้งที่ประเมิน** (history) — ไม่ overwrite
- `skills` JSONB: `{rec:5, pay:3, ...}` 20 ตัว
- `justifications` JSONB
- `qualitative` JSONB: `{hr:{q1,q2,q3}, dig:{...}, soft:{...}}`

### `latest_assessment` (view)
- ดึง assessment ล่าสุดของแต่ละพนักงาน — ใช้ในหน้าเว็บ

---

## 🔒 ความปลอดภัย

- **RLS เปิดทุก table** — anon key เปิดเผยใน HTML ได้
- พนักงานทั่วไป: อ่านได้ทุกคน, แก้ได้แต่ assessment ของตัวเอง
- Admin: ทำได้ทุกอย่าง
- PIN 6 หลัก = entropy ต่ำ → Supabase Auth มี rate limit ในตัว แต่ควรเปลี่ยน PIN เริ่มต้นทันที

---

## 🐛 Troubleshooting

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| login แล้วขึ้น "ไม่พบโปรไฟล์" | `employees.auth_user_id` ไม่ตรง | รัน `admin_set_pin()` ใหม่ |
| "Email not confirmed" | ลืมปิด confirm email | Auth → Providers → Email → ปิด Confirm |
| โหลดข้อมูลไม่ขึ้น | URL/anon key ผิด | เช็คใน Project Settings → API |
| บันทึกไม่ได้ | RLS reject | ตรวจว่า login เป็นเจ้าของ assessment |
