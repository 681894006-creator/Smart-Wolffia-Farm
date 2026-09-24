/**
 * SMART WOLFFIA FARM V3 — CONFIGURATION & CONSTANTS
 * Supabase Credentials, System Threshold Defaults & Demo Simulator Presets
 */

const APP_CONFIG = {
  appName: "SMART WOLFFIA FARM",
  version: "3.0.0",
  subTitle: "ระบบเพาะเลี้ยงไข่ผำอัจฉริยะเพื่อการผลิตโปรตีนทางเลือก",

  // Supabase Realtime & Auth Credentials
  supabase: {
    url: "https://xyzexample.supabase.co", // User replaces with their Supabase URL
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykey" // User replaces with anon key
  },

  // API Local ESP32 Endpoint
  esp32ApiUrl: "http://192.168.1.100", // Default local ESP32 IP
  pollingIntervalMs: 5000,

  // Initial Operating Parameters (Prototype Defaults)
  thresholds: {
    ph: {
      normalMin: 5.5,
      normalMax: 6.5,
      warnMin: 5.0,
      warnMax: 7.0,
      alertMin: 4.5,
      alertMax: 7.5,
      criticalMin: 4.5,
      criticalMax: 8.0
    },
    temperature: {
      normalMin: 20.0,
      normalMax: 30.0,
      warnMax: 31.0,
      alertMax: 32.0,
      criticalMax: 32.0
    },
    light: {
      normalMin: 6000,
      normalMax: 12000,
      warnMin: 4000,
      warnMax: 15000,
      alertMin: 2000,
      alertMax: 20000,
      criticalMin: 2000,
      criticalMax: 20000
    },
    waterLevel: {
      normalMin: 40,
      normalMax: 70,
      warnMin: 30,
      warnMax: 80,
      alertMin: 20,
      alertMax: 90,
      criticalMin: 20
    }
  },

  // Demo Mode Simulator Presets
  demoPresets: {
    NORMAL: {
      ph: 6.2,
      temperature: 28.4,
      light: 8450,
      waterLevel: 68,
      pump: true,
      mode: "AUTO",
      status: "NORMAL",
      sensorHealth: { ph: "OK", temperature: "OK", light: "OK", waterLevel: "OK" },
      trend: { temperature: "STABLE", ph: "STABLE", light: "STABLE", waterLevel: "STABLE" },
      recommendation: "ขณะนี้ไม่มีสิ่งที่ต้องดำเนินการ ระบบกำลังตรวจสอบสภาพแวดล้อมโดยอัตโนมัติ"
    },
    WARNING_TEMP: {
      ph: 6.3,
      temperature: 30.5,
      light: 9200,
      waterLevel: 55,
      pump: true,
      mode: "AUTO",
      status: "WARNING",
      sensorHealth: { ph: "OK", temperature: "OK", light: "OK", waterLevel: "OK" },
      trend: { temperature: "UP", ph: "STABLE", light: "STABLE", waterLevel: "DOWN" },
      recommendation: "อุณหภูมิน้ำเริ่มสูงขึ้น แนะนำให้ตรวจสอบบริเวณเพาะเลี้ยงและการระบายอากาศ"
    },
    ALERT_WATER: {
      ph: 6.1,
      temperature: 29.0,
      light: 7800,
      waterLevel: 18,
      pump: false,
      mode: "AUTO",
      status: "CRITICAL",
      sensorHealth: { ph: "OK", temperature: "OK", light: "OK", waterLevel: "OK" },
      trend: { temperature: "STABLE", ph: "STABLE", light: "STABLE", waterLevel: "DOWN" },
      recommendation: "ระดับน้ำต่ำเกินไป (18%) ระบบตัดการทำงานของปั๊มอัตโนมัติเพื่อป้องกันปั๊มไหม้ เติมน้ำก่อนเปิดปั๊ม"
    },
    SENSOR_ERROR: {
      ph: 14.0,
      temperature: 85.0,
      light: 0,
      waterLevel: 0,
      pump: false,
      mode: "AUTO",
      status: "SENSOR ERROR",
      sensorHealth: { ph: "ERROR", temperature: "ERROR", light: "OK", waterLevel: "ERROR" },
      trend: { temperature: "STABLE", ph: "STABLE", light: "STABLE", waterLevel: "STABLE" },
      recommendation: "ไม่สามารถอ่านข้อมูลจากเซนเซอร์ได้ กรุณาตรวจสอบสายไฟและการเชื่อมต่ออุปกรณ์"
    },
    OFFLINE: {
      ph: 6.2,
      temperature: 28.4,
      light: 8450,
      waterLevel: 68,
      pump: false,
      mode: "AUTO",
      status: "OFFLINE",
      sensorHealth: { ph: "OFFLINE", temperature: "OFFLINE", light: "OFFLINE", waterLevel: "OFFLINE" },
      trend: { temperature: "STABLE", ph: "STABLE", light: "STABLE", waterLevel: "STABLE" },
      recommendation: "ไม่สามารถเชื่อมต่ออุปกรณ์ ESP32 ได้ แสดงข้อมูลล่าสุดก่อนการเชื่อมต่อขาดหาย"
    }
  }
};
