# 🌿 Smart Wolffia Farm - ระบบฟาร์มไข่ผำอัจฉริยะ ESP32 Real-Time Dashboard (v2.0)

ระบบเว็บแอปพลิเคชันแสดงผลและสั่งการฟาร์มบ่อเลี้ยงไข่ผำ (Wolffia Globosa) แบบเรียลไทม์ เชื่อมต่อกับบอร์ด **ESP32 Microcontroller** ผ่าน **Firebase Realtime Database**

---

## 🌟 ฟีเจอร์หลักของระบบ (Key Features)

1. **📊 Real-Time Telemetry Dashboard**:
   - **อุณหภูมิน้ำ (°C)**: เซนเซอร์ DS18B20 (Pin 4) - แจ้งเตือนเมื่อ > 32°C
   - **ค่า pH ของน้ำ**: pH Sensor (Pin 34) - ช่วงเหมาะสม 6.0 - 8.0
   - **ความเข้มแสง (Lux)**: BH1750 I2C (SDA Pin 21, SCL Pin 22)
   - **ระดับน้ำในบ่อ (%)**: Water Level Sensor (Pin 35) พร้อม Liquid Tank Wave Animation
   - **สถานะระบบจาก ESP32 (`status`)**: แสดงข้อความแจ้งเตือนเรียลไทม์

2. **🎛️ สั่งการอุปกรณ์ทางไกล (Remote Actuator Control - Relay Pin 26)**:
   - **Auto Mode Switch**: เปิด-ปิดการทำงานอัตโนมัติตามระดับน้ำ (เปิดปั๊มเมื่อ ≤30%, ปิดปั๊มเมื่อ ≥70%)
   - **Manual Pump Switch**: สวิตช์สั่งเปิด-ปิดปั๊มน้ำด้วยตนเองผ่าน Firebase Realtime Database
   - **Safety Cut-off Alert**: ระบบป้องกันปั๊มทำงานเกิน 5 นาที

3. **🌱 Harvest Days Tracker & Yield Estimator**:
   - แถบแสดงจำนวนวันที่เลี้ยงผำ (`harvestDays`) เทียบกับเป้าหมาย 7 วัน
   - ปุ่ม **"🔄 เริ่มนับรอบการเลี้ยงผำใหม่ (Reset Cycle)"** ส่งคำสั่ง `/controls/resetHarvest = true`
   - เอฟเฟกต์ฉลอง (Confetti celebration) เมื่อผำโตครบ 7 วัน
   - เครื่องมือคำนวณผลผลิต (กก.) และประเมินรายได้ (บาท) ตามขนาดพื้นที่บ่อผำ

4. **⚡ ESP32 Simulator & Offline Testing Mode**:
   - ปุ่มสลับใช้งานระหว่าง **Firebase Realtime Database** และ **ESP32 Simulator Engine** เพื่อทดสอบระบบเว็บได้โดยไม่ต้องเสียบอุปกรณ์จริง

5. **📈 Realtime Trend Chart & CSV Export**:
   - กราฟเส้น Chart.js บันทึกการเปลี่ยนแปลงของอุณหภูมิ, pH, และระดับน้ำแบบเรียลไทม์
   - ปุ่มกด Export ข้อมูลเป็นไฟล์ `.csv`

6. **📲 LINE Notify & Code Generator**:
   - ปุ่มทดสอบส่งแจ้งเตือนเข้า LINE Notify
   - หน้าต่างแสดงโค้ด C++ Arduino สำเร็จรูปพร้อมปุ่มคัดลอก

---

## 📁 โครงสร้างไฟล์ในโปรเจกต์ (`c:\โปรเจค`)

```
c:\โปรเจค\
├── index.html           # หน้าจอเว็บแดชบอร์ดหลัก
├── css\
│   └── styles.css       # Design System (Bio-Tech Emerald, Glassmorphism, Dark/Light Mode)
├── js\
│   ├── config.js        # กำหนดค่า Firebase Database Host & Safety Thresholds
│   ├── simulator.js     # เครื่องมือจำลองสัญญาณ ESP32 Telemetry
│   ├── weather.js       # พยากรณ์อากาศและแสงแดดสำหรับฟาร์มผำ
│   ├── codeViewer.js    # ซอร์สโค้ด ESP32 และระบบทดสอบ LINE Notify
│   └── app.js           # ตัวควบคุมหลัก (Realtime Chart, Firebase Sync, Switch Controls)
└── README.md            # คู่มือการใช้งานและเอกสารอ้างอิง
```

---

## 🔗 โครงสร้าง Firebase Realtime Database Nodes

```json
{
  "sensors": {
    "temperature": 28.5,
    "ph": 6.8,
    "lux": 15400,
    "waterPercent": 50,
    "pump": false,
    "autoMode": true,
    "harvestDays": 3,
    "status": "🟢 ระบบทำงานปกติ สภาวะแวดล้อมเหมาะสม"
  },
  "controls": {
    "autoMode": true,
    "pumpCmd": false,
    "resetHarvest": false
  }
}
```

---

## 🚀 วิธีการใช้งาน (Getting Started)

1. เปิดไฟล์ `index.html` บนเว็บเบราว์เซอร์ใดก็ได้ (Chrome, Edge, Safari, Firefox, หรือเว็บบนมือถือ)
2. เมื่อเปิดขึ้นมา ระบบจะเชื่อมต่อกับ **Firebase Realtime Database** ที่ URL:
   `https://smart-wolffia-farm-default-rtdb.asia-southeast1.firebasedatabase.app/`
3. หากต้องการทดสอบระบบโดยไม่มีฮาร์ดแวร์ สามารถกดปุ่ม **"แหล่งข้อมูล: Firebase RTDB"** มุมขวาบนเพื่อสลับเป็น **"ESP32 Simulator"** ได้ทันที

---

## 🛠️ แผนผังการต่อสาย ESP32 (Pinout Wiring Guide)

| อุปกรณ์/เซนเซอร์ | พินบน ESP32 | หมายเหตุ |
| :--- | :--- | :--- |
| **DS18B20 Water Temp** | GPIO 4 | ต่อ Pull-up Resistor 4.7kΩ |
| **pH Sensor Analog Out** | GPIO 34 (ADC1) | ขาอ่านค่าแรงดัน pH |
| **Water Level Sensor** | GPIO 35 (ADC1) | ขาอ่านค่าระดับน้ำ |
| **BH1750 Light (SDA)** | GPIO 21 | I2C Data |
| **BH1750 Light (SCL)** | GPIO 22 | I2C Clock |
| **Relay Control Pump** | GPIO 26 | Active LOW Relay Module |

---

&copy; 2026 Smart Wolffia Farm Dashboard. All rights reserved.
