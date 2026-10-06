# 🌱 SMART WOLFFIA FARM V3 — SYSTEM INTEGRATION & SETUP GUIDE

## ระบบเพาะเลี้ยงไข่ผำอัจฉริยะเพื่อการผลิตโปรตีนทางเลือก
**IoT Smart Agriculture + Authentication + Supabase Realtime + Role-Based Access Control (RBAC)**

---

## 1. โครงสร้างไฟล์ในโปรเจกต์ (Web Project Structure)

- `index.html`: หน้าหลัก Dashboard รองรับ Public Viewer, Viewer และ Admin พร้อม Layout แบบ Responsive
- `login.html`: หน้าเข้าสู่ระบบ (Login) รองรับ Supabase Auth, แสดง/ซ่อน รหัสผ่าน, ลืมรหัสผ่าน, และเข้าชมแบบ Public
- `config.js`: การตั้งค่า Supabase URL, Anon Key, ESP32 API IP Endpoint และ Threshold Defaults
- `dataService.js`: Data Service เชื่อมต่อ Supabase Data, ESP32 REST API, ตรวจสอบสถานะ DATA STALE / DEVICE OFFLINE และระบบ Hardware Safety Lock
- `script.js`: Application Controller จัดการ Router, Session, RBAC Permission Checks และ Chart Engine
- `style.css`: Master Stylesheet โทนสีเขียวธรรมชาติ Modern Smart Agriculture Clean & Minimal Layout
- `supabase/schema.sql`: PostgreSQL Database Schema, Triggers, Table definitions, และ RLS Policies

---

## 2. คู่มือการตั้งค่า Supabase Database & RLS Policies

### Step 2.1 Execution SQL Script
1. เข้าไปที่ **Supabase Dashboard** -> เลือกโปรเจกต์ของคุณ -> เมนู **SQL Editor**
2. เปิดไฟล์ `supabase/schema.sql` คัดลอกคำสั่ง SQL ทั้งหมดไปวางและกด **RUN**
3. คำสั่งนี้จะสร้างตาราง:
   - `profiles` (เก็บสิทธิ์ผู้ใช้ role: 'admin' หรือ 'viewer')
   - `sensor_readings` (เก็บข้อมูลเซนเซอร์จริงจาก ESP32)
   - `growth_records` (เก็บข้อมูลการเจริญเติบโต)
   - `harvest_records` (เก็บข้อมูลการเก็บเกี่ยว)
   - `nutrient_records` (เก็บข้อมูลการเติมสารอาหาร)
   - `audit_logs` (เก็บประวัติการกระทำคำสั่งในระบบ)

### Step 2.2 Row Level Security (RLS) Summary
- **PUBLIC (Anon)**: อ่านข้อมูลเซนเซอร์, การเติบโต, การเก็บเกี่ยว, สารอาหารได้เท่านั้น ไม่สามารถ INSERT/UPDATE/DELETE หรือสั่งการปั๊มได้
- **VIEWER (Authenticated Viewer)**: อ่านข้อมูลย้อนหลัง กราฟ สถิติ ได้ทั้งหมด ไม่สามารถควบคุมอุปกรณ์หรือแก้ไขข้อมูลได้
- **ADMIN (Authenticated Admin)**: ได้รับสิทธิ์เต็มในการควบคุมปั๊มน้ำ, AUTO/MANUAL, Emergency Stop, Calibration, Settings, User Management และ CRUD ข้อมูล

---

## 3. วิธีการสร้างผู้ใช้งาน ADMIN และ VIEWER

### วิธีที่ 1: ผ่าน Supabase Auth UI (แนะนำ)
1. ไปที่ Supabase Dashboard -> **Authentication** -> **Users** -> กด **Add User** -> **Create User**
2. สร้างผู้ใช้ เช่น:
   - Admin Email: `admin@wolffia.farm` / Password: `YourPassword123`
   - Viewer Email: `viewer@wolffia.farm` / Password: `YourPassword123`
3. ไปที่ **SQL Editor** แล้วรันคำสั่งกำหนดสิทธิ์ Role:
```sql
-- กำหนดสิทธิ์ Admin
UPDATE public.profiles 
SET role = 'admin', display_name = 'ผู้ดูแลระบบ (Admin)' 
WHERE email = 'admin@wolffia.farm';

-- กำหนดสิทธิ์ Viewer
UPDATE public.profiles 
SET role = 'viewer', display_name = 'ผู้ใช้งาน (Viewer)' 
WHERE email = 'viewer@wolffia.farm';
```

---

## 4. วิธีการเชื่อมต่อ Web Dashboard กับ Supabase

1. ไปที่ Supabase Dashboard -> **Project Settings** -> **API**
2. คัดลอก **Project URL** และ **anon public Key**
3. เปิดไฟล์ `config.js` บน Web Project และแก้ไข:
```javascript
const APP_CONFIG = {
  appName: "SMART WOLFFIA FARM",
  version: "3.0.0",

  supabase: {
    url: "https://YOUR_PROJECT_REF.supabase.co",
    anonKey: "YOUR_SUPABASE_ANON_KEY"
  },

  esp32ApiUrl: "http://192.168.1.100", // หมายเลข IP ของบอร์ด ESP32 บนวง LAN
  pollingIntervalMs: 3000
};
```

---

## 5. วิธีการเชื่อมต่อ Web Dashboard กับ ESP32 REST API

ESP32 ต้องเชื่อมต่อเครือข่าย Wi-Fi เดียวกันและรัน REST API endpoints ต่อไปนี้:

### Endpoints สำหรับอ่านข้อมูล:
- `GET /api/data`: คืนค่า JSON ล่าสุด (`ph`, `temperature`, `light`, `water_level`, `pump_status`, `system_mode`, `system_status`)
- `GET /api/status`: คืนค่าสถานะอุปกรณ์

### Endpoints สำหรับสั่งการ (เฉพาะ Admin):
- `POST /api/pump/on`: สั่งเปิดปั๊มน้ำ (จะถูก Safety Check `water_level >= 20%` เสมอ)
- `POST /api/pump/off`: สั่งปิดปั๊มน้ำ
- `POST /api/mode/auto`: เปลี่ยนโหมดเป็น AUTO
- `POST /api/mode/manual`: เปลี่ยนโหมดเป็น MANUAL
- `POST /api/emergency/stop`: หยุดการทำงานฉุกเฉิน

---

## 6. การทดสอบความถูกต้องของระบบ (Final Verification Checklist)

1. **Public View**: ไม่ต้อง Login -> สามารถดู Dashboard และข้อมูลเซนเซอร์จริงได้ หากกดปุ่มเปิดปั๊ม ระบบจะแจ้งเตือน `"ฟังก์ชันนี้สำหรับผู้ดูแลระบบ"`
2. **Viewer View**: Login ด้วยบัญชี Viewer -> แสดง Badge `VIEWER` สามารถดูรายงาน กราฟ และประวัติได้ แต่ปุ่มควบคุมปั๊มและการแก้ไขข้อมูลจะถูกปิดล็อก
3. **Admin View**: Login ด้วยบัญชี Admin -> แสดง Badge `ADMIN` สามารถสั่งการปั๊ม เปลี่ยนโหมด AUTO/MANUAL และบันทึกข้อมูลการเจริญเติบโต/เก็บเกี่ยวได้ครบถ้วน
4. **Data Integrity & Safety**: หากระดับน้ำต่ำกว่า 20% ระบบความปลอดภัย Hardware Safety Lock จะปฏิเสธการเปิดปั๊มทันที
