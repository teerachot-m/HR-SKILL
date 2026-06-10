#!/usr/bin/env node
/**
 * seed_auth.js
 * สร้าง Supabase Auth user ให้พนักงานทุกคนใน public.employees ผ่าน Admin API
 *
 * 1) ลบ auth user เก่าทุกตัวที่ email ลงท้ายด้วย @hr.local
 * 2) ลบ auth_user_id ใน employees ทั้งหมด (จะตั้งใหม่)
 * 3) สร้าง auth user ใหม่ผ่าน admin.createUser (email_confirm=true)
 * 4) ผูก employees.auth_user_id กับ user ที่สร้าง
 * 5) บังคับ must_change_pin=true ทุกคน
 *
 * รัน: node scripts/seed_auth.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE;

if (!URL || !KEY) {
  console.error('❌ ต้องการ SUPABASE_URL และ SUPABASE_SERVICE_ROLE ใน .env.local');
  process.exit(1);
}

const sb = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PIN = '000000';

async function main() {
  // ── 1) ดึงพนักงานทั้งหมด ─────────────────────────────────
  const { data: emps, error: e1 } = await sb
    .from('employees')
    .select('id, emp_code')
    .order('emp_code');
  if (e1) throw e1;
  console.log(`📋 พบพนักงาน ${emps.length} คนใน employees`);

  // ── 2) ลบ auth_user_id ใน employees ก่อน (เพื่อหลีกเลี่ยง FK) ─
  const { error: eClear } = await sb
    .from('employees')
    .update({ auth_user_id: null })
    .not('id', 'is', null);
  if (eClear) throw eClear;

  // ── 3) ลบ auth user เดิมทั้งหมดที่ email @hr.local ─────────
  console.log('🗑️  ลบ auth users เดิม...');
  let page = 1;
  let deleted = 0;
  while (true) {
    const { data: list, error: eList } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (eList) throw eList;
    const users = list.users.filter(u => (u.email || '').endsWith('@hr.local'));
    for (const u of users) {
      const { error } = await sb.auth.admin.deleteUser(u.id);
      if (error) console.warn(`   ⚠️  ลบ ${u.email} ไม่ได้: ${error.message}`);
      else deleted++;
    }
    if (list.users.length < 1000) break;
    page++;
  }
  console.log(`   ลบไป ${deleted} accounts`);

  // ── 4) สร้าง auth user ใหม่ทุกคนผ่าน Admin API ─────────────
  console.log('👤 สร้าง auth users ใหม่...');
  let ok = 0, fail = 0;
  for (const emp of emps) {
    const email = `${emp.emp_code.toLowerCase()}@hr.local`;
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: DEFAULT_PIN,
      email_confirm: true,
      user_metadata: { emp_code: emp.emp_code },
    });
    if (error) {
      console.error(`   ❌ ${emp.emp_code}: ${error.message}`);
      fail++; continue;
    }
    // ผูกเข้า employees
    const { error: eUpd } = await sb
      .from('employees')
      .update({ auth_user_id: data.user.id, must_change_pin: true })
      .eq('id', emp.id);
    if (eUpd) {
      console.error(`   ❌ ผูก ${emp.emp_code}: ${eUpd.message}`);
      fail++; continue;
    }
    ok++;
    if (ok % 10 === 0) console.log(`   ... ${ok}/${emps.length}`);
  }

  console.log('');
  console.log(`✅ เสร็จสิ้น — สำเร็จ ${ok}, ล้มเหลว ${fail}`);
  console.log(`   ทุกคนใช้ PIN เริ่มต้น: ${DEFAULT_PIN}`);
  console.log(`   ลอง login ด้วย: 06863 / ${DEFAULT_PIN}`);
}

main().catch(err => {
  console.error('💥 ERROR:', err.message || err);
  process.exit(1);
});
