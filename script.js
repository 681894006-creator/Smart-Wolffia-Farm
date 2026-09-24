/**
 * SMART WOLFFIA FARM V3 — APPLICATION CONTROLLER (SECTION 22 ENHANCED)
 * Router, Auth Guard, Telemetry Sync, Section 22 Analytics & Chart Engines
 */

class WolffiaApp {
  constructor() {
    this.currentUser = JSON.parse(sessionStorage.getItem("wolffia_user")) || { email: "admin@wolffia.farm", role: "admin", display_name: "Admin Demo" };
    this.activePage = "dashboard";
    this.dashboardChart = null;
    this.growthChart = null;
    this.historyChart = null;
    this.forecastChart = null;
    this.correlationChart = null;
    this.syncTimer = null;

    this.init();
  }

  async init() {
    console.log("[WolffiaApp] Starting Smart Wolffia Farm V3 App with Analytics Engine...");

    this.updateUserUI();
    this.bindGlobalEvents();
    await this.loadPage("dashboard");
    this.startTelemetryLoop();
  }

  // --------------------------------------------------------------------------
  // 1. AUTHENTICATION & RBAC CONTROL
  // --------------------------------------------------------------------------
  updateUserUI() {
    const avatar = document.getElementById("navUserAvatar");
    const name = document.getElementById("navUserName");
    const role = document.getElementById("navUserRole");

    if (this.currentUser) {
      if (avatar) avatar.textContent = this.currentUser.display_name.charAt(0).toUpperCase();
      if (name) name.textContent = this.currentUser.display_name;
      if (role) {
        role.textContent = this.currentUser.role.toUpperCase();
        role.className = `user-role-tag role-${this.currentUser.role}`;
      }

      const isAdmin = this.currentUser.role === "admin";
      ["navUsers", "navSettings", "navAudit"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isAdmin ? "flex" : "none";
      });
    }
  }

  checkAdminPermission(actionName) {
    if (!this.currentUser || this.currentUser.role !== "admin") {
      alert(`⛔ ปฏิเสธคำสั่ง (403 Forbidden)\n\nเฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่ได้รับสิทธิ์ดำเนินการ: ${actionName}`);
      return false;
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // 2. ROUTER & PAGE LOADER
  // --------------------------------------------------------------------------
  bindGlobalEvents() {
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const page = item.getAttribute("data-page");
        if (page) {
          document.querySelectorAll(".sidebar-nav .nav-item").forEach(el => el.classList.remove("active"));
          item.classList.add("active");
          this.loadPage(page);
        }
      });
    });

    document.getElementById("btnLogout")?.addEventListener("click", () => {
      sessionStorage.removeItem("wolffia_user");
      window.location.href = "login.html";
    });

    document.getElementById("btnModeDemo")?.addEventListener("click", () => {
      DataService.currentMode = "DEMO";
      document.getElementById("btnModeDemo").classList.add("active");
      document.getElementById("btnModeLive").classList.remove("active");
      document.getElementById("presetSelector").style.display = "inline-block";
      this.refreshTelemetryUI();
    });

    document.getElementById("btnModeLive")?.addEventListener("click", () => {
      DataService.currentMode = "LIVE";
      document.getElementById("btnModeLive").classList.add("active");
      document.getElementById("btnModeDemo").classList.remove("active");
      document.getElementById("presetSelector").style.display = "none";
      this.refreshTelemetryUI();
    });

    document.getElementById("presetSelector")?.addEventListener("change", (e) => {
      const presetKey = e.target.value;
      if (APP_CONFIG.demoPresets[presetKey]) {
        DataService.state = { ...APP_CONFIG.demoPresets[presetKey] };
        this.refreshTelemetryUI();
      }
    });

    document.querySelectorAll(".btn-close-modal").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("active"));
      });
    });
  }

  async loadPage(pageName) {
    this.activePage = pageName;
    const outlet = document.getElementById("pageOutlet");
    if (!outlet) return;

    try {
      const res = await fetch(`pages/${pageName}.html`);
      if (res.ok) {
        outlet.innerHTML = await res.text();
        this.bindPageEvents(pageName);
      } else {
        outlet.innerHTML = `<div class="panel-card"><h3>ไม่พบหน้า ${pageName}</h3></div>`;
      }
    } catch (e) {
      console.error(`[Router] Error loading ${pageName}:`, e);
    }
  }

  bindPageEvents(pageName) {
    if (pageName === "dashboard") {
      this.initDashboardPage();
    } else if (pageName === "history") {
      this.initHistoryPage();
    } else if (pageName === "weekly-stats") {
      this.initWeeklyStatsPage();
    } else if (pageName === "monthly-stats") {
      this.initMonthlyStatsPage();
    } else if (pageName === "sales") {
      this.initSalesPage();
    } else if (pageName === "forecast") {
      this.initForecastChart();
    } else if (pageName === "correlation") {
      this.initCorrelationChart();
    } else if (pageName === "growth") {
      this.initGrowthChart();
    }
    this.refreshTelemetryUI();
  }

  // --------------------------------------------------------------------------
  // 3. PAGE INITIALIZERS & EVENT HANDLERS
  // --------------------------------------------------------------------------
  initDashboardPage() {
    document.getElementById("btnOpenPhModal")?.addEventListener("click", () => {
      document.getElementById("modalPH")?.classList.add("active");
    });

    document.getElementById("btnModeAuto")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("เปลี่ยนโหมดเป็น AUTO")) return;
      if (confirm("ต้องการเปลี่ยนโหมดเป็น [ AUTO ] หรือไม่?")) {
        await DataService.setSystemMode("AUTO");
        this.refreshTelemetryUI();
      }
    });

    document.getElementById("btnModeManual")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("เปลี่ยนโหมดเป็น MANUAL")) return;
      if (confirm("⚠️ ยืนยันเปลี่ยนโหมดเป็น [ MANUAL ]?\n\nคุณจะเป็นผู้สั่งการปั๊มด้วยตนเอง")) {
        await DataService.setSystemMode("MANUAL");
        this.refreshTelemetryUI();
      }
    });

    document.getElementById("btnPumpOn")?.addEventListener("click", () => {
      if (!this.checkAdminPermission("เปิดปั๊มน้ำ (Pump ON)")) return;
      if (DataService.state.waterLevel < 20) {
        document.getElementById("modalSafetyAlert")?.classList.add("active");
        return;
      }
      document.getElementById("modalPumpConfirm")?.classList.add("active");
    });

    document.getElementById("btnConfirmPumpOn")?.addEventListener("click", async () => {
      document.getElementById("modalPumpConfirm")?.classList.remove("active");
      const res = await DataService.setPumpState(true);
      if (!res.success) {
        document.getElementById("modalSafetyAlert")?.classList.add("active");
      }
      this.refreshTelemetryUI();
    });

    document.getElementById("btnPumpOff")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("ปิดปั๊มน้ำ (Pump OFF)")) return;
      await DataService.setPumpState(false);
      this.refreshTelemetryUI();
    });

    this.initDashboardChart();
  }

  initHistoryPage() {
    this.initHistoryChart();
    document.getElementById("btnExportCSV")?.addEventListener("click", async () => {
      const data = await DataService.getSensorHistory("24h");
      DataService.exportToCSV("wolffia_telemetry_history", data);
    });
  }

  initWeeklyStatsPage() {
    document.getElementById("btnPrintWeeklyReport")?.addEventListener("click", () => {
      window.print();
    });
    document.getElementById("btnExportWeeklyCSV")?.addEventListener("click", async () => {
      const stats = await DataService.getWeeklyStats();
      DataService.exportToCSV("weekly_statistics", [stats.thisWeek, stats.lastWeek]);
    });
  }

  initMonthlyStatsPage() {
    document.getElementById("btnExportMonthlyCSV")?.addEventListener("click", async () => {
      const stats = await DataService.getMonthlyStats();
      DataService.exportToCSV("monthly_statistics", [stats]);
    });
  }

  initSalesPage() {
    document.getElementById("formSale")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.checkAdminPermission("บันทึกข้อมูลการขาย")) return;
      alert("✓ บันทึกรายการขายใหม่เรียบร้อยแล้ว");
    });
  }

  // --------------------------------------------------------------------------
  // 4. REALTIME SYNC LOOP & UI REFRESH
  // --------------------------------------------------------------------------
  startTelemetryLoop() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(async () => {
      await DataService.getLatestSensorData();
      this.refreshTelemetryUI();
    }, 5000);
  }

  refreshTelemetryUI() {
    const s = DataService.state;

    const chipText = document.getElementById("connectionStatusText");
    const chip = document.getElementById("connectionStatus");
    if (chipText && chip) {
      if (DataService.currentMode === "DEMO") {
        chipText.textContent = "🟢 DEMO MODE (ข้อมูลจำลอง)";
        chip.className = "connection-chip";
      } else {
        if (DataService.isLiveConnected) {
          chipText.textContent = "⚡ LIVE ESP32 (เชื่อมต่อแล้ว)";
          chip.className = "connection-chip";
        } else {
          chipText.textContent = "⚡ LIVE ESP32 (รอการเชื่อมต่อ)";
          chip.className = "connection-chip offline";
        }
      }
    }

    const lastCheck = document.getElementById("lastCheckTime");
    if (lastCheck) lastCheck.textContent = DataService.lastUpdateTimestamp;

    // Status Banner
    const statusBanner = document.getElementById("statusBanner");
    const statusIcon = document.getElementById("statusIcon");
    const statusTitle = document.getElementById("statusTitle");
    const statusDesc = document.getElementById("statusDesc");

    if (statusBanner && statusTitle) {
      if (s.status === "NORMAL") {
        statusBanner.className = "status-banner";
        if (statusIcon) statusIcon.innerHTML = `<i class="fa-solid fa-circle-check text-emerald"></i>`;
        statusTitle.className = "status-title-text text-emerald";
        statusTitle.textContent = "🟢 NORMAL";
        if (statusDesc) statusDesc.textContent = "ระบบเพาะเลี้ยงทำงานตามปกติ สภาพแวดล้อมเหมาะสมสำหรับไข่ผำ";
      } else if (s.status === "WARNING") {
        statusBanner.className = "status-banner status-warning";
        if (statusIcon) statusIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-amber"></i>`;
        statusTitle.className = "status-title-text text-amber";
        statusTitle.textContent = "🟡 WARNING";
        if (statusDesc) statusDesc.textContent = s.statusMessage;
      } else if (s.status === "ALERT" || s.status === "CRITICAL") {
        statusBanner.className = "status-banner status-critical";
        if (statusIcon) statusIcon.innerHTML = `<i class="fa-solid fa-circle-exclamation text-rose"></i>`;
        statusTitle.className = "status-title-text text-rose";
        statusTitle.textContent = `🔴 ${s.status}`;
        if (statusDesc) statusDesc.textContent = s.statusMessage;
      } else {
        statusBanner.className = "status-banner status-check";
        if (statusIcon) statusIcon.innerHTML = `<i class="fa-solid fa-plug-circle-xmark"></i>`;
        statusTitle.textContent = `⚠️ ${s.status}`;
        if (statusDesc) statusDesc.textContent = s.statusMessage;
      }
    }

    // Trends
    if (document.getElementById("ewPhTrend")) document.getElementById("ewPhTrend").textContent = `→ ${s.trend.ph}`;
    if (document.getElementById("ewTempTrend")) document.getElementById("ewTempTrend").textContent = `↗ ${s.trend.temperature}`;
    if (document.getElementById("ewLightTrend")) document.getElementById("ewLightTrend").textContent = `→ ${s.trend.light}`;
    if (document.getElementById("ewWaterTrend")) document.getElementById("ewWaterTrend").textContent = `↘ ${s.trend.waterLevel}`;
    if (document.getElementById("ewTemp")) document.getElementById("ewTemp").textContent = s.temperature;

    // Sensor Cards Values
    if (document.getElementById("valPH")) document.getElementById("valPH").textContent = s.ph;
    if (document.getElementById("valTemp")) document.getElementById("valTemp").textContent = s.temperature;
    if (document.getElementById("valLight")) document.getElementById("valLight").textContent = s.light.toLocaleString();
    if (document.getElementById("valWater")) document.getElementById("valWater").textContent = s.waterLevel;

    if (document.getElementById("cardPumpStateText")) document.getElementById("cardPumpStateText").textContent = s.pump ? "ON" : "OFF";
    if (document.getElementById("cardPumpModeText")) document.getElementById("cardPumpModeText").textContent = `(โหมด ${s.mode})`;
    if (document.getElementById("cardPumpStatusBadge")) {
      document.getElementById("cardPumpStatusBadge").className = `status-badge ${s.pump ? 'status-good' : 'status-danger'}`;
      document.getElementById("cardPumpStatusBadge").textContent = s.pump ? "🟢 ON" : "🔴 OFF";
    }

    if (document.getElementById("cardWifiStateText")) {
      document.getElementById("cardWifiStateText").textContent = s.wifi ? "ONLINE" : "OFFLINE";
    }
    if (document.getElementById("cardWifiBadge")) {
      document.getElementById("cardWifiBadge").className = `status-badge ${s.wifi ? 'status-good' : 'status-danger'}`;
      document.getElementById("cardWifiBadge").textContent = s.wifi ? "🟢 ONLINE" : "🔴 OFFLINE";
    }

    if (document.getElementById("dotTemp")) {
      const pct = Math.min(100, Math.max(0, ((s.temperature - 20) / 15) * 100));
      document.getElementById("dotTemp").style.left = `${pct}%`;
    }
    if (document.getElementById("fillWater")) {
      document.getElementById("fillWater").style.width = `${s.waterLevel}%`;
    }

    if (document.getElementById("userRecommendationBox")) {
      document.getElementById("userRecommendationBox").textContent = s.recommendation;
    }

    // Safety Lock Banner
    const safetyBanner = document.getElementById("safetyLockBanner");
    if (safetyBanner) {
      safetyBanner.style.display = s.waterLevel < 20 ? "block" : "none";
    }

    this.updateDashboardChart(s);
  }

  // --------------------------------------------------------------------------
  // 5. CHART.JS ENGINES
  // --------------------------------------------------------------------------
  initDashboardChart() {
    const ctx = document.getElementById("dashboardChart");
    if (!ctx) return;

    this.dashboardChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          { label: "อุณหภูมิน้ำ (°C)", data: [], borderColor: "#ef4444", tension: 0.3 },
          { label: "pH", data: [], borderColor: "#06b6d4", tension: 0.3 },
          { label: "ระดับน้ำ (%)", data: [], borderColor: "#10b981", tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#94a3b8" } } },
        scales: {
          x: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
        }
      }
    });
  }

  updateDashboardChart(s) {
    if (!this.dashboardChart) return;
    const nowStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    this.dashboardChart.data.labels.push(nowStr);
    this.dashboardChart.data.datasets[0].data.push(s.temperature);
    this.dashboardChart.data.datasets[1].data.push(s.ph);
    this.dashboardChart.data.datasets[2].data.push(s.waterLevel);

    if (this.dashboardChart.data.labels.length > 15) {
      this.dashboardChart.data.labels.shift();
      this.dashboardChart.data.datasets.forEach(ds => ds.data.shift());
    }
    this.dashboardChart.update();
  }

  initHistoryChart() {
    const ctx = document.getElementById("historyDetailedChart");
    if (!ctx) return;

    this.historyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["10:00", "11:00", "12:00", "13:00", "14:00", "14:32"],
        datasets: [
          { label: "อุณหภูมิน้ำ (°C)", data: [27.5, 27.8, 28.2, 28.5, 28.4, 28.4], borderColor: "#ef4444", tension: 0.3 },
          { label: "ค่า pH", data: [6.1, 6.2, 6.2, 6.3, 6.2, 6.2], borderColor: "#06b6d4", tension: 0.3 },
          { label: "ระดับน้ำ (%)", data: [70, 69, 68, 68, 68, 68], borderColor: "#10b981", tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#94a3b8" } } },
        scales: {
          x: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
        }
      }
    });
  }

  initGrowthChart() {
    const ctx = document.getElementById("growthTrendChart");
    if (!ctx) return;

    this.growthChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["01/09", "03/09", "05/09", "07/09", "10/09", "14/09"],
        datasets: [
          { label: "น้ำหนักสด (g)", data: [100, 145, 190, 320, 580, 890], backgroundColor: "rgba(16, 185, 129, 0.6)", borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#94a3b8" } } },
        scales: {
          x: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
        }
      }
    });
  }

  initForecastChart() {
    const ctx = document.getElementById("forecastChart");
    if (!ctx) return;

    this.forecastChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["สัปดาห์ 35", "สัปดาห์ 36", "สัปดาห์ 37", "สัปดาห์ 38 (ปัจจุบัน)", "สัปดาห์ 39 (คาดการณ์)"],
        datasets: [
          { label: "ผลผลิตจริง (Actual Yield kg)", data: [1.2, 1.4, 1.56, 1.85, null], borderColor: "#10b981", tension: 0.3 },
          { label: "คาดการณ์ (Forecast Yield kg)", data: [null, null, null, 1.85, 2.2], borderColor: "#f59e0b", borderDash: [5, 5], tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#94a3b8" } } },
        scales: {
          x: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
        }
      }
    });
  }

  initCorrelationChart() {
    const ctx = document.getElementById("correlationChart");
    if (!ctx) return;

    this.correlationChart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [{
          label: "อุณหภูมิ (°C) vs Growth Rate (g/วัน)",
          data: [
            { x: 24.0, y: 35.0 },
            { x: 26.5, y: 48.0 },
            { x: 28.4, y: 58.2 },
            { x: 30.0, y: 52.0 },
            { x: 32.0, y: 22.0 }
          ],
          backgroundColor: "#06b6d4",
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#94a3b8" } } },
        scales: {
          x: { title: { display: true, text: "อุณหภูมิน้ำ (°C)", color: "#94a3b8" }, ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { title: { display: true, text: "Growth Rate (g/วัน)", color: "#94a3b8" }, ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
        }
      }
    });
  }
}

// Global App Initialization
document.addEventListener("DOMContentLoaded", () => {
  window.app = new WolffiaApp();
});
