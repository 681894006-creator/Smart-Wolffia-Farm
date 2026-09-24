/**
 * SMART WOLFFIA FARM V3 — UNIFIED DEMO DATA ENGINE & DATA SERVICE LAYER
 * Single Central Demo State (demoSensorData & demoHistoryData) Powering All Pages
 */

// Global Unified Demo Data State
window.demoSensorData = {
  temperature: 28.5,
  ph: 6.8,
  waterLevel: 82,
  lightPct: 75,
  lightLux: 8450,
  pump: true,
  mode: "AUTO",
  systemStatus: "ปกติ", // ปกติ, แจ้งเตือน, ผิดปกติ
  statusMessage: "ระบบเพาะเลี้ยงทำงานตามปกติ สภาพแวดล้อมเหมาะสมสำหรับไข่ผำ",
  wifi: true,
  esp32: true,
  lastUpdate: "25/09/2026 00:45",
  tempStatus: "ปกติ",
  phStatus: "ปกติ",
  waterStatus: "ปกติ",
  lightStatus: "เหมาะสม",
  trend: {
    ph: "STABLE",
    temperature: "UP",
    light: "STABLE",
    waterLevel: "DOWN"
  },
  sensorHealth: {
    ph: "OK",
    temperature: "OK",
    light: "OK",
    waterLevel: "OK",
    esp32: "ONLINE",
    wifi: "CONNECTED",
    pump: "READY"
  },
  recommendation: "ขณะนี้ไม่มีสิ่งที่ต้องดำเนินการ ระบบกำลังตรวจสอบสภาพแวดล้อมโดยอัตโนมัติ"
};

// Generate 30 Central Demo History Logs
window.demoHistoryData = [
  { date: "25/09/2026", time: "00:45", temperature: 28.5, ph: 6.8, waterLevel: 82, lightPct: 75, pump: "ON", status: "ปกติ" },
  { date: "25/09/2026", time: "00:40", temperature: 28.4, ph: 6.8, waterLevel: 82, lightPct: 74, pump: "ON", status: "ปกติ" },
  { date: "25/09/2026", time: "00:35", temperature: 28.6, ph: 6.9, waterLevel: 81, lightPct: 76, pump: "OFF", status: "ปกติ" },
  { date: "25/09/2026", time: "00:30", temperature: 28.3, ph: 6.7, waterLevel: 82, lightPct: 74, pump: "ON", status: "ปกติ" },
  { date: "25/09/2026", time: "00:25", temperature: 28.5, ph: 6.8, waterLevel: 83, lightPct: 75, pump: "ON", status: "ปกติ" },
  { date: "25/09/2026", time: "00:20", temperature: 28.7, ph: 6.9, waterLevel: 83, lightPct: 77, pump: "ON", status: "ปกติ" },
  { date: "25/09/2026", time: "00:15", temperature: 28.6, ph: 6.8, waterLevel: 82, lightPct: 76, pump: "OFF", status: "ปกติ" },
  { date: "25/09/2026", time: "00:10", temperature: 28.4, ph: 6.7, waterLevel: 84, lightPct: 74, pump: "ON", status: "ปกติ" },
  { date: "25/09/2026", time: "00:05", temperature: 28.2, ph: 6.7, waterLevel: 84, lightPct: 72, pump: "ON", status: "ปกติ" },
  { date: "25/09/2026", time: "00:00", temperature: 28.1, ph: 6.6, waterLevel: 85, lightPct: 70, pump: "OFF", status: "ปกติ" },
  { date: "24/09/2026", time: "23:55", temperature: 28.3, ph: 6.7, waterLevel: 85, lightPct: 71, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "23:50", temperature: 28.5, ph: 6.8, waterLevel: 84, lightPct: 73, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "23:45", temperature: 28.6, ph: 6.8, waterLevel: 84, lightPct: 75, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "23:40", temperature: 28.4, ph: 6.7, waterLevel: 85, lightPct: 74, pump: "OFF", status: "ปกติ" },
  { date: "24/09/2026", time: "23:35", temperature: 28.2, ph: 6.7, waterLevel: 85, lightPct: 72, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "23:30", temperature: 28.1, ph: 6.6, waterLevel: 86, lightPct: 70, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "23:25", temperature: 28.0, ph: 6.6, waterLevel: 86, lightPct: 69, pump: "OFF", status: "ปกติ" },
  { date: "24/09/2026", time: "23:20", temperature: 28.2, ph: 6.7, waterLevel: 86, lightPct: 71, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "23:15", temperature: 28.4, ph: 6.8, waterLevel: 85, lightPct: 73, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "23:10", temperature: 28.5, ph: 6.8, waterLevel: 85, lightPct: 74, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "23:05", temperature: 28.3, ph: 6.7, waterLevel: 86, lightPct: 72, pump: "OFF", status: "ปกติ" },
  { date: "24/09/2026", time: "23:00", temperature: 28.1, ph: 6.6, waterLevel: 86, lightPct: 70, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "22:55", temperature: 28.2, ph: 6.7, waterLevel: 87, lightPct: 71, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "22:50", temperature: 28.4, ph: 6.8, waterLevel: 87, lightPct: 73, pump: "ON", status: "ปกติ" },
  { date: "24/09/2026", time: "22:45", temperature: 28.6, ph: 6.9, waterLevel: 86, lightPct: 75, pump: "OFF", status: "ปกติ" }
];

const DataService = {
  currentMode: "DEMO", // "DEMO" or "LIVE"
  isLiveConnected: false,

  // --------------------------------------------------------------------------
  // 1. MOCK ENGINE (MICRO-FLUCTUATIONS EVERY 2-5 SECONDS)
  // --------------------------------------------------------------------------
  simulateStep() {
    if (this.currentMode !== "DEMO") return;

    // Sequence fluctuation logic specified by user:
    // Temp: 28.3 → 28.5 → 28.4 → 28.6 °C
    // pH: 6.7 → 6.8 → 6.8 → 6.9
    // Water Level: 82 → 81 → 82 → 80 %
    // Light: 74 → 75 → 76 → 73 %

    const deltaTemp = (Math.random() * 0.4 - 0.2);
    const deltaPH = (Math.random() * 0.2 - 0.1);
    const deltaWater = (Math.random() * 2 - 1);
    const deltaLight = Math.floor(Math.random() * 4 - 2);

    window.demoSensorData.temperature = parseFloat(Math.min(33.0, Math.max(20.0, window.demoSensorData.temperature + deltaTemp)).toFixed(1));
    window.demoSensorData.ph = parseFloat(Math.min(8.0, Math.max(5.0, window.demoSensorData.ph + deltaPH)).toFixed(1));
    window.demoSensorData.waterLevel = Math.min(100, Math.max(10, Math.round(window.demoSensorData.waterLevel + deltaWater)));
    window.demoSensorData.lightPct = Math.min(100, Math.max(10, Math.round(window.demoSensorData.lightPct + deltaLight)));
    window.demoSensorData.lightLux = Math.round((window.demoSensorData.lightPct / 100) * 11250);

    const now = new Date();
    window.demoSensorData.lastUpdate = now.toLocaleDateString("th-TH") + " " + now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // Dynamic Status Evaluation
    window.demoSensorData.tempStatus = window.demoSensorData.temperature > 31.0 ? "สูง" : window.demoSensorData.temperature < 22.0 ? "ต่ำ" : "ปกติ";
    window.demoSensorData.phStatus = window.demoSensorData.ph > 7.5 ? "สูง" : window.demoSensorData.ph < 5.5 ? "ต่ำ" : "ปกติ";
    window.demoSensorData.waterStatus = window.demoSensorData.waterLevel < 30 ? "ต่ำ" : window.demoSensorData.waterLevel > 90 ? "สูง" : "ปกติ";
    window.demoSensorData.lightStatus = window.demoSensorData.lightPct < 40 ? "ต่ำ" : window.demoSensorData.lightPct > 90 ? "สูง" : "เหมาะสม";

    // Overall Status
    if (window.demoSensorData.waterLevel < 20) {
      window.demoSensorData.systemStatus = "ผิดปกติ";
      window.demoSensorData.statusMessage = "🛑 SAFETY LOCK: ระดับน้ำต่ำเกินไป (< 20%) ระบบปิดปั๊มอัตโนมัติ";
      window.demoSensorData.recommendation = "เติมน้ำในถังเพาะเลี้ยงก่อนเปิดปั๊มใหม่";
      window.demoSensorData.pump = false;
    } else if (window.demoSensorData.temperature > 31.0 || window.demoSensorData.ph < 5.0 || window.demoSensorData.ph > 7.5) {
      window.demoSensorData.systemStatus = "แจ้งเตือน";
      window.demoSensorData.statusMessage = "🟡 แจ้งเตือน: สภาพแวดล้อมบางรายการเริ่มอยู่นอกเกณฑ์ปกติ";
      window.demoSensorData.recommendation = "ตรวจสอบสภาพแวดล้อมและการระบายอากาศ";
    } else {
      window.demoSensorData.systemStatus = "ปกติ";
      window.demoSensorData.statusMessage = "🟢 ระบบเพาะเลี้ยงทำงานตามปกติ สภาพแวดล้อมเหมาะสมสำหรับไข่ผำ";
      window.demoSensorData.recommendation = "ขณะนี้ไม่มีสิ่งที่ต้องดำเนินการ ระบบกำลังตรวจสอบสภาพแวดล้อมโดยอัตโนมัติ";
    }

    // Append entry into demoHistoryData stream
    window.demoHistoryData.unshift({
      date: now.toLocaleDateString("th-TH"),
      time: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      temperature: window.demoSensorData.temperature,
      ph: window.demoSensorData.ph,
      waterLevel: window.demoSensorData.waterLevel,
      lightPct: window.demoSensorData.lightPct,
      pump: window.demoSensorData.pump ? "ON" : "OFF",
      status: window.demoSensorData.systemStatus
    });

    if (window.demoHistoryData.length > 50) window.demoHistoryData.pop();
  },

  // --------------------------------------------------------------------------
  // 2. SUPABASE / LIVE PREPARATION & FALLBACK
  // --------------------------------------------------------------------------
  async getLatestSensorData() {
    if (this.currentMode === "DEMO") {
      this.simulateStep();
      return { ...window.demoSensorData };
    } else {
      try {
        let liveData = null;

        // Try Supabase Client
        if (window.supabaseClient) {
          const { data, error } = await window.supabaseClient
            .from('sensor_readings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

          if (!error && data && data.length > 0) liveData = data[0];
        }

        // Fallback to local ESP32 API
        if (!liveData && typeof APP_CONFIG !== "undefined") {
          const res = await fetch(`${APP_CONFIG.esp32ApiUrl}/api/data`, { timeout: 2500 });
          if (res.ok) liveData = await res.json();
        }

        if (liveData) {
          this.isLiveConnected = true;
          window.demoSensorData = { ...window.demoSensorData, ...liveData, wifi: true, esp32: true };
          return { ...window.demoSensorData };
        } else {
          // If live fetch returns NO DATA -> Auto Fallback to DEMO MODE
          console.warn("[DataService] No live data available. Seamlessly falling back to Demo Mode.");
          this.isLiveConnected = false;
          this.currentMode = "DEMO";
          this.simulateStep();
          return { ...window.demoSensorData };
        }
      } catch (err) {
        console.warn("[DataService] Live connection error. Falling back to Demo Mode.");
        this.isLiveConnected = false;
        this.currentMode = "DEMO";
        this.simulateStep();
        return { ...window.demoSensorData };
      }
    }
  },

  // --------------------------------------------------------------------------
  // 3. STATISTICAL CALCULATIONS FROM CENTRAL HISTORY STREAM
  // --------------------------------------------------------------------------
  async getTelemetryStatistics() {
    const history = window.demoHistoryData;
    if (!history.length) return null;

    const temps = history.map(h => h.temperature);
    const phs = history.map(h => h.ph);
    const waters = history.map(h => h.waterLevel);
    const lights = history.map(h => h.lightPct);
    const pumpOnCount = history.filter(h => h.pump === "ON" || h.pump === true).length;

    const avg = arr => (arr.reduce((a, b) => a + b, 0) / arr.length);

    return {
      tempAvg: avg(temps).toFixed(1),
      tempMin: Math.min(...temps).toFixed(1),
      tempMax: Math.max(...temps).toFixed(1),
      phAvg: avg(phs).toFixed(1),
      phMin: Math.min(...phs).toFixed(1),
      phMax: Math.max(...phs).toFixed(1),
      waterAvg: Math.round(avg(waters)),
      waterMin: Math.min(...waters),
      waterMax: Math.max(...waters),
      lightAvg: Math.round(avg(lights)),
      lightMin: Math.min(...lights),
      lightMax: Math.max(...lights),
      pumpRunCount: pumpOnCount,
      pumpRuntimeHours: (pumpOnCount * 0.25).toFixed(1)
    };
  },

  // SENSORS SPECIFICATION LIST
  getSensorsDetailList() {
    const d = window.demoSensorData;
    return [
      { name: "อุณหภูมิน้ำ (Water Temperature)", sensorType: "DS18B20 (Pin 4)", value: `${d.temperature} °C`, unit: "°C", status: d.tempStatus, minLimit: "25.0 °C", normalRange: "25.0 – 30.0 °C", maxLimit: "32.0 °C" },
      { name: "ค่า pH ของน้ำ (pH Probe)", sensorType: "PH-4502C (Pin 34)", value: `${d.ph} pH`, unit: "pH", status: d.phStatus, minLimit: "6.0 pH", normalRange: "6.0 – 7.5 pH", maxLimit: "7.5 pH" },
      { name: "ระดับน้ำในถัง (Water Level)", sensorType: "HC-SR04 (Pin 5/18)", value: `${d.waterLevel} %`, unit: "%", status: d.waterStatus, minLimit: "40 %", normalRange: "40 – 100 %", maxLimit: "100 %" },
      { name: "ความเข้มแสง (Light Intensity)", sensorType: "BH1750 (Pin 21/22)", value: `${d.lightPct} % (${d.lightLux.toLocaleString()} lux)`, unit: "%", status: d.lightStatus, minLimit: "60 %", normalRange: "60 – 90 %", maxLimit: "100 %" },
      { name: "สถานะปั๊มน้ำ (Relay Pump)", sensorType: "Relay Module (Pin 26)", value: d.pump ? "ON" : "OFF", unit: "State", status: d.pump ? "ปกติ" : "OFF", minLimit: "-", normalRange: "AUTO Cycle", maxLimit: "-" },
      { name: "สถานะระบบรวม (System Health)", sensorType: "ESP32 Core Engine", value: d.systemStatus, unit: "Status", status: d.systemStatus, minLimit: "-", normalRange: "ปกติ", maxLimit: "-" }
    ];
  },

  // ANALYTICS SUMMARY COMPUTATION
  async getAnalyticsSummary() {
    const stats = await this.getTelemetryStatistics();
    return {
      tempTrend: `อุณหภูมิเฉลี่ยในช่วงเวลาที่เลือกเท่ากับ ${stats.tempAvg}°C อยู่ในช่วงที่กำหนด สภาพแวดล้อมดีเยี่ยมสำหรับการเติบโตของไข่ผำ`,
      phTrend: `ค่า pH เฉลี่ยเท่ากับ ${stats.phAvg} pH มีความเสถียร เหมาะสมต่อการดูดซึมธาตุอาหารของไข่ผำ`,
      waterTrend: `ระดับน้ำเฉลี่ยอยู่ที่ ${stats.waterAvg}% ปริมาณน้ำหมุนเวียนเพียงพอ`,
      lightTrend: `ความเข้มแสงเฉลี่ยอยู่ที่ ${stats.lightAvg}% การสังเคราะห์แสงมีประสิทธิภาพสูง`,
      pumpSummary: `ปั๊มน้ำเปิดหมุนเวียนเวียนไปทั้งสิ้น ${stats.pumpRunCount} ครั้ง (รวมเวลาประมาณ ${stats.pumpRuntimeHours} ชั่วโมง)`
    };
  },

  // --------------------------------------------------------------------------
  // 4. SECTION 22 API HELPERS
  // --------------------------------------------------------------------------
  async getBatchData() {
    return [
      { batch_id: "BATCH-2026-01", batch_name: "รอบที่ 1", start_date: "01/09/2026", end_date: "14/09/2026", initial_weight_g: 100, final_weight_g: 890, growth_rate_g_day: 56.4, status: "HARVESTED" },
      { batch_id: "BATCH-2026-02", batch_name: "รอบที่ 2 (ปัจจุบัน)", start_date: "15/09/2026", end_date: "-", initial_weight_g: 120, final_weight_g: 680, growth_rate_g_day: 56.0, status: "ACTIVE" }
    ];
  },

  async getWeeklyStats() {
    return {
      thisWeek: { totalProductionKg: 1.85, avgHarvestWeightG: 925, harvestCount: 2, growthRateGDay: 58.2, avgPH: 6.8, avgTemp: 28.5, avgLight: 75, avgWater: 82, pumpRuntimeHours: 42.5, totalSalesThb: 2850 },
      lastWeek: { totalProductionKg: 1.56, avgHarvestWeightG: 780, harvestCount: 2, growthRateGDay: 48.5, avgPH: 6.7, avgTemp: 29.1, avgLight: 72, avgWater: 80, pumpRuntimeHours: 39.0, totalSalesThb: 2400 },
      comparison: { productionChangePct: "+18.6%", productionTrend: "↑", salesChangePct: "+18.8%", salesTrend: "↑" }
    };
  },

  async getMonthlyStats() {
    return { monthLabel: "กันยายน 2026", totalProductionKg: 6.85, totalHarvestCount: 8, totalSalesThb: 10450, totalCostThb: 3200, totalProfitThb: 7250 };
  },

  async getSalesData() {
    return [
      { id: "SALE-001", date: "24/09/2026", product: "ไข่ผำสด", weightKg: 2.5, pricePerKg: 150, revenue: 375, cost: 100, profit: 275, channel: "หน้าร้าน" },
      { id: "SALE-002", date: "22/09/2026", product: "ไข่ผำสด", weightKg: 5.0, pricePerKg: 140, revenue: 700, cost: 200, profit: 500, channel: "ขายส่ง" }
    ];
  },

  async getForecastData() {
    return {
      nextWeekYieldForecast: { minKg: 2.0, maxKg: 2.4, expectedKg: 2.2 },
      nextWeekSalesDemand: { minKg: 2.2, maxKg: 2.8, expectedKg: 2.5 },
      nextWeekRevenueForecast: { minThb: 3100, maxThb: 3800, expectedThb: 3450 }
    };
  },

  async getCorrelationData() {
    return { summary: "ข้อมูลที่เก็บได้พบความสัมพันธ์ระดับปานกลางระหว่างอุณหภูมิและอัตราการเติบโต" };
  },

  exportToCSV(filename, jsonArray) {
    if (!jsonArray || !jsonArray.length) return;
    const headers = Object.keys(jsonArray[0]).join(",");
    const rows = jsonArray.map(obj => Object.values(obj).map(val => `"${val}"`).join(","));
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // --------------------------------------------------------------------------
  // 5. COMMAND SETTERS
  // --------------------------------------------------------------------------
  async setPumpState(state) {
    if (state && window.demoSensorData.waterLevel < 20) {
      return { success: false, reason: "SAFETY_LOCK", message: "🛑 SAFETY LOCK: ไม่สามารถเปิดปั๊มได้ เนื่องจากระดับน้ำต่ำเกินไป (< 20%)" };
    }
    window.demoSensorData.pump = state;
    return { success: true };
  },

  async setSystemMode(mode) {
    window.demoSensorData.mode = mode;
    return { success: true };
  }
};
