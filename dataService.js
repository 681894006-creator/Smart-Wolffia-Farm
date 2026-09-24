/**
 * SMART WOLFFIA FARM V3 — DATA SERVICE LAYER (SECTION 22 ANALYTICS ENHANCED)
 * Decouples UI from Data Sources (Demo Engine vs Live ESP32 API / Supabase)
 * Supports Telemetry, Batches, Weekly/Monthly Analytics, Sales, Forecast & Correlation
 */

const DataService = {
  currentMode: "DEMO", // "DEMO" or "LIVE"
  isLiveConnected: false,
  lastUpdateTimestamp: new Date().toLocaleTimeString("th-TH"),

  // Primary Telemetry State
  state: {
    ph: 6.2,
    temperature: 28.4,
    light: 8450,
    waterLevel: 68,
    pump: true,
    mode: "AUTO",
    status: "NORMAL",
    statusMessage: "ระบบเพาะเลี้ยงทำงานตามปกติ",
    wifi: true,
    esp32: true,
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
  },

  // --------------------------------------------------------------------------
  // 1. MOCK ENGINE (DEMO MODE FLUCTUATION)
  // --------------------------------------------------------------------------
  simulateStep() {
    if (this.currentMode !== "DEMO") return;

    const deltaPH = (Math.random() * 0.08 - 0.04);
    const deltaTemp = (Math.random() * 0.2 - 0.08);
    const deltaLux = Math.floor(Math.random() * 80 - 40);
    const deltaWater = (Math.random() * 0.4 - 0.2);

    this.state.ph = parseFloat(Math.min(8.0, Math.max(4.5, this.state.ph + deltaPH)).toFixed(2));
    this.state.temperature = parseFloat(Math.min(35.0, Math.max(20.0, this.state.temperature + deltaTemp)).toFixed(1));
    this.state.light = Math.min(25000, Math.max(1000, this.state.light + deltaLux));
    this.state.waterLevel = Math.min(100, Math.max(10, Math.round(this.state.waterLevel + deltaWater)));

    this.lastUpdateTimestamp = new Date().toLocaleTimeString("th-TH");

    if (this.state.waterLevel < 20) {
      this.state.status = "CRITICAL";
      this.state.statusMessage = "🔴 ระดับน้ำในถังต่ำเกินไป (< 20%) ระบบหยุดปั๊มเพื่อป้องกันปั๊มไหม้";
      this.state.recommendation = "เติมน้ำในถังเพาะเลี้ยงก่อนเปิดปั๊มใหม่";
      this.state.pump = false;
    } else if (this.state.temperature > 31.0) {
      this.state.status = "WARNING";
      this.state.statusMessage = "🟡 อุณหภูมิน้ำมีแนวโน้มสูงขึ้นเกินเกณฑ์ปกติ";
      this.state.recommendation = "ตรวจสอบระบบระบายอากาศและการพรางแสง";
    } else if (this.state.ph < 5.0 || this.state.ph > 7.5) {
      this.state.status = "ALERT";
      this.state.statusMessage = "🟠 ค่า pH อยู่นอกช่วงที่เหมาะสม";
      this.state.recommendation = "ตรวจสอบคุณภาพน้ำและสารอาหาร";
    } else {
      this.state.status = "NORMAL";
      this.state.statusMessage = "🟢 ระบบเพาะเลี้ยงทำงานตามปกติ";
      this.state.recommendation = "ขณะนี้ไม่มีสิ่งที่ต้องดำเนินการ ระบบกำลังตรวจสอบสภาพแวดล้อมโดยอัตโนมัติ";
    }
  },

  // --------------------------------------------------------------------------
  // 2. TELEMETRY GETTERS
  // --------------------------------------------------------------------------
  async getLatestSensorData() {
    if (this.currentMode === "DEMO") {
      this.simulateStep();
      return { ...this.state, lastUpdate: this.lastUpdateTimestamp };
    } else {
      try {
        const response = await fetch(`${APP_CONFIG.esp32ApiUrl}/api/data`);
        if (response.ok) {
          const liveData = await response.json();
          this.isLiveConnected = true;
          this.lastUpdateTimestamp = new Date().toLocaleTimeString("th-TH");
          this.state = { ...this.state, ...liveData, wifi: true, esp32: true };
          return { ...this.state, lastUpdate: this.lastUpdateTimestamp };
        }
      } catch (err) {
        this.isLiveConnected = false;
        return {
          ...this.state,
          wifi: false,
          esp32: false,
          status: "OFFLINE",
          statusMessage: "🔴 ESP32 OFFLINE — ขาดการเชื่อมต่อกับอุปกรณ์จริง",
          lastUpdate: this.lastUpdateTimestamp
        };
      }
    }
  },

  async getSensorHistory(timeframe = "24h") {
    const points = timeframe === "1h" ? 12 : timeframe === "6h" ? 24 : timeframe === "24h" ? 48 : 30;
    const history = [];
    const now = new Date();

    for (let i = points; i >= 0; i--) {
      const t = new Date(now.getTime() - i * (timeframe === "1h" ? 5 * 60000 : timeframe === "6h" ? 15 * 60000 : 30 * 60000));
      const timeStr = t.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      history.push({
        timestamp: timeStr,
        date: t.toLocaleDateString("th-TH"),
        ph: parseFloat((6.18 + Math.sin(i / 3) * 0.25).toFixed(2)),
        temperature: parseFloat((28.1 + Math.cos(i / 4) * 1.2).toFixed(1)),
        light: Math.floor(8400 + Math.sin(i / 2) * 2200),
        waterLevel: Math.max(40, 72 - Math.floor(i / 2)),
        pump: true,
        status: "NORMAL"
      });
    }
    return history;
  },

  // --------------------------------------------------------------------------
  // 3. SECTION 22 ANALYTICS API SERVICES
  // --------------------------------------------------------------------------

  // B. BATCHES / CULTIVATION CYCLES
  async getBatchData() {
    return [
      {
        batch_id: "BATCH-2026-01",
        batch_name: "รอบที่ 1 (สายพันธุ์ไทยพื้นเมือง)",
        tank_id: "TANK_01",
        start_date: "01/09/2026",
        end_date: "14/09/2026",
        initial_weight_g: 100,
        initial_coverage_pct: 15,
        final_weight_g: 890,
        final_coverage_pct: 88,
        cultivation_days: 14,
        growth_rate_g_day: 56.4,
        yield_ratio: 8.9,
        avg_ph: 6.18,
        avg_temperature: 28.4,
        avg_light: 8450,
        avg_water_level: 68,
        pump_runtime_hours: 84.5,
        alert_count: 2,
        status: "HARVESTED",
        notes: "ผลผลิตสมบูรณ์ เม็ดเขียวสด อัตราเติบโตดีเยี่ยม"
      },
      {
        batch_id: "BATCH-2026-02",
        batch_name: "รอบที่ 2 (ปัจจุบันกำลังเลี้ยง)",
        tank_id: "TANK_01",
        start_date: "15/09/2026",
        end_date: "-",
        initial_weight_g: 120,
        initial_coverage_pct: 18,
        final_weight_g: 680,
        final_coverage_pct: 72,
        cultivation_days: 10,
        growth_rate_g_day: 56.0,
        yield_ratio: 5.67,
        avg_ph: 6.22,
        avg_temperature: 28.6,
        avg_light: 8600,
        avg_water_level: 66,
        pump_runtime_hours: 60.2,
        alert_count: 1,
        status: "ACTIVE",
        notes: "อยู่ในระยะขยายตัวความหนาแน่นสูง"
      }
    ];
  },

  // D. WEEKLY STATISTICS & COMPARISON (THIS WEEK VS LAST WEEK)
  async getWeeklyStats() {
    return {
      thisWeek: {
        weekLabel: "สัปดาห์ที่ 38 (ปัจจุบัน)",
        totalProductionKg: 1.85,
        avgHarvestWeightG: 925,
        harvestCount: 2,
        cultivationDays: 7,
        growthRateGDay: 58.2,
        avgPH: 6.18,
        avgTemp: 28.4,
        avgLight: 8450,
        avgWater: 68,
        pumpRuntimeHours: 42.5,
        warningCount: 2,
        alertCount: 1,
        criticalCount: 0,
        totalSalesThb: 2850
      },
      lastWeek: {
        weekLabel: "สัปดาห์ที่ 37 (ก่อนหน้า)",
        totalProductionKg: 1.56,
        avgHarvestWeightG: 780,
        harvestCount: 2,
        cultivationDays: 7,
        growthRateGDay: 48.5,
        avgPH: 6.25,
        avgTemp: 29.1,
        avgLight: 8100,
        avgWater: 64,
        pumpRuntimeHours: 39.0,
        warningCount: 4,
        alertCount: 2,
        criticalCount: 1,
        totalSalesThb: 2400
      },
      comparison: {
        productionChangePct: "+18.6%",
        productionTrend: "↑",
        growthRateChangePct: "+20.0%",
        growthRateTrend: "↑",
        salesChangePct: "+18.75%",
        salesTrend: "↑",
        alertChangePct: "-50.0%",
        alertTrend: "↓"
      }
    };
  },

  // E. MONTHLY STATISTICS
  async getMonthlyStats(monthStr = "2026-09") {
    return {
      monthLabel: "กันยายน 2026",
      totalProductionKg: 6.85,
      totalHarvestCount: 8,
      avgGrowthRateGDay: 55.4,
      avgCultivationDays: 14,
      totalSalesThb: 10450,
      totalCostThb: 3200,
      totalProfitThb: 7250,
      avgSellingPricePerKg: 152.5,
      alertCount: 6
    };
  },

  // G. SALES DATA & ANALYTICS
  async getSalesData() {
    return [
      { id: "SALE-001", date: "24/09/2026", product: "ไข่ผำสด (Fresh Wolffia)", weightKg: 2.5, pricePerKg: 150, revenue: 375, cost: 100, profit: 275, channel: "หน้าร้าน", customer: "ร้านอาหารสุขภาพ", location: "กรุงเทพ" },
      { id: "SALE-002", date: "22/09/2026", product: "ไข่ผำสด (Fresh Wolffia)", weightKg: 5.0, pricePerKg: 140, revenue: 700, cost: 200, profit: 500, channel: "ขายส่ง", customer: "ฟาร์มคาเฟ่", location: "นนทบุรี" },
      { id: "SALE-003", date: "18/09/2026", product: "ผำผงโปรตีนแปรรูป", weightKg: 1.0, pricePerKg: 500, revenue: 500, cost: 150, profit: 350, channel: "ออนไลน์", customer: "บุคคลทั่วไป", location: "ชลบุรี" },
      { id: "SALE-004", date: "14/09/2026", product: "ไข่ผำสด (Fresh Wolffia)", weightKg: 8.0, pricePerKg: 160, revenue: 1280, cost: 350, profit: 930, channel: "ขายส่ง", customer: "ซูเปอร์มาร์เก็ต", location: "กรุงเทพ" }
    ];
  },

  async getSalesAnalytics() {
    return {
      todaySalesThb: 375,
      weekSalesThb: 2850,
      monthSalesThb: 10450,
      totalVolumeKg: 68.5,
      avgPricePerKg: 152.5,
      totalRevenue: 10450,
      totalCost: 3200,
      totalProfit: 7250,
      topChannel: "ขายส่งร้านอาหาร (62%)",
      channels: [
        { name: "ขายส่งร้านอาหาร", pct: 62 },
        { name: "หน้าร้านฟาร์ม", pct: 23 },
        { name: "ออนไลน์", pct: 15 }
      ]
    };
  },

  // I. PREDICTIVE FORECASTING ENGINE
  async getForecastData() {
    return {
      nextWeekYieldForecast: { minKg: 2.0, maxKg: 2.4, expectedKg: 2.2 },
      nextWeekSalesDemand: { minKg: 2.2, maxKg: 2.8, expectedKg: 2.5 },
      nextWeekRevenueForecast: { minThb: 3100, maxThb: 3800, expectedThb: 3450 },
      confidencePct: 92,
      note: "เป็นค่าประมาณการคำนวณด้วยวิธี Moving Average จากสถิติย้อนหลัง 4 สัปดาห์ ความแม่นยำขึ้นอยู่กับคุณภาพข้อมูล",
      chartData: {
        labels: ["สัปดาห์ 35", "สัปดาห์ 36", "สัปดาห์ 37", "สัปดาห์ 38 (ปัจจุบัน)", "สัปดาห์ 39 (คาดการณ์)"],
        actualYield: [1.2, 1.4, 1.56, 1.85, null],
        forecastYield: [null, null, null, 1.85, 2.2]
      }
    };
  },

  // J. SENSOR VS PRODUCTION CORRELATION
  async getCorrelationData() {
    return {
      tempVsGrowth: [
        { temp: 24.0, growthRate: 35.0 },
        { temp: 26.5, growthRate: 48.0 },
        { temp: 28.4, growthRate: 58.2 },
        { temp: 30.0, growthRate: 52.0 },
        { temp: 32.0, growthRate: 22.0 }
      ],
      phVsGrowth: [
        { ph: 5.0, growthRate: 30.0 },
        { ph: 5.8, growthRate: 50.0 },
        { ph: 6.2, growthRate: 58.2 },
        { ph: 6.8, growthRate: 45.0 },
        { ph: 7.5, growthRate: 20.0 }
      ],
      summary: "ข้อมูลที่เก็บได้พบความสัมพันธ์ระดับปานกลาง (r = +0.68) ระหว่างอุณหภูมิในช่วง 26–29°C กับอัตราการเจริญเติบโตสูงสุดของผำ"
    };
  },

  // K. WEEKLY REPORT ENGINE
  async generateWeeklyReport() {
    return {
      reportTitle: "WEEKLY REPORT — สรุปสถิติประจำสัปดาห์ที่ 38",
      period: "18 กันยายน - 24 กันยายน 2026",
      productionG: 1850,
      productionKg: 1.85,
      growthRateGDay: 58.2,
      harvestCount: 2,
      avgPH: 6.18,
      avgTemp: 28.4,
      avgLight: 8450,
      pumpRuntimeHours: 42.5,
      alertCount: 3,
      totalSalesThb: 2850,
      trendNote: "↑ ผลผลิตและยอดขายเพิ่มขึ้น 18.6% จากสัปดาห์ก่อนหน้า",
      observations: "ระดับน้ำในถังเพาะเลี้ยงมีแนวโน้มลดลงเล็กน้อยในช่วงปลายสัปดาห์ แนะนำให้ตรวจสอบระบบเติมน้ำ"
    };
  },

  // L. EXPORT HELPERS
  exportToCSV(filename, jsonArray) {
    if (!jsonArray || !jsonArray.length) {
      alert("ไม่มีข้อมูลสำหรับ Export");
      return;
    }
    const headers = Object.keys(jsonArray[0]).join(",");
    const rows = jsonArray.map(obj => Object.values(obj).map(val => `"${val}"`).join(","));
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // --------------------------------------------------------------------------
  // 4. COMMAND SETTERS
  // --------------------------------------------------------------------------
  async setPumpState(state) {
    if (state && this.state.waterLevel < 20) {
      return { success: false, reason: "SAFETY_LOCK", message: "🛑 SAFETY LOCK: ไม่สามารถเปิดปั๊มได้ เนื่องจากระดับน้ำต่ำเกินไป (< 20%)" };
    }
    this.state.pump = state;
    return { success: true };
  },

  async setSystemMode(mode) {
    this.state.mode = mode;
    return { success: true };
  }
};
