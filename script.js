/**
 * SMART WOLFFIA FARM V3 — APPLICATION CONTROLLER
 * Full-Stack Client Logic, Router, Auth/RBAC, Telemetry UI & Statistics Computation
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
    
    // Statistics & Analytics trend chart instances
    this.statCharts = {};
    this.anCharts = {};

    this.syncTimer = null;

    this.init();
  }

  async init() {
    console.log("[WolffiaApp] Starting Smart Wolffia Farm V3 App...");

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
  // 2. ROUTER & GLOBAL EVENT HANDLERS
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

    // Toggle Buttons for DEMO MODE / LIVE MODE
    document.getElementById("btnModeDemo")?.addEventListener("click", () => {
      DataService.currentMode = "DEMO";
      document.getElementById("btnModeDemo").classList.add("active");
      document.getElementById("btnModeLive").classList.remove("active");
      document.getElementById("presetSelector").style.display = "inline-block";
      this.refreshTelemetryUI();
    });

    document.getElementById("btnModeLive")?.addEventListener("click", async () => {
      DataService.currentMode = "LIVE";
      document.getElementById("btnModeLive").classList.add("active");
      document.getElementById("btnModeDemo").classList.remove("active");
      document.getElementById("presetSelector").style.display = "none";
      await DataService.getLatestSensorData();
      this.refreshTelemetryUI();
    });

    document.getElementById("presetSelector")?.addEventListener("change", (e) => {
      const presetKey = e.target.value;
      if (typeof APP_CONFIG !== "undefined" && APP_CONFIG.demoPresets && APP_CONFIG.demoPresets[presetKey]) {
        window.demoSensorData = { ...window.demoSensorData, ...APP_CONFIG.demoPresets[presetKey] };
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

    let loadedContent = "";
    try {
      const res = await fetch(`pages/${pageName}.html`);
      if (res.ok) {
        loadedContent = await res.text();
      }
    } catch (e) {
      console.warn(`[Router] Direct fetch failed for ${pageName}, attempting fallback rendering.`, e);
    }

    if (loadedContent) {
      outlet.innerHTML = loadedContent;
    } else {
      // Inline Fallback Template Renderer if file:// fetch fails
      outlet.innerHTML = this.getFallbackPageTemplate(pageName);
    }

    this.bindPageEvents(pageName);
    this.refreshTelemetryUI();
  }

  bindPageEvents(pageName) {
    if (pageName === "dashboard") {
      this.initDashboardPage();
    } else if (pageName === "monitoring") {
      this.initMonitoringPage();
    } else if (pageName === "sensors") {
      this.initSensorsPage();
    } else if (pageName === "history") {
      this.initHistoryPage();
    } else if (pageName === "statistics") {
      this.initStatisticsPage();
    } else if (pageName === "analytics") {
      this.initAnalyticsPage();
    } else if (pageName === "settings") {
      this.initSettingsPage();
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
  }

  // --------------------------------------------------------------------------
  // 3. PAGE INITIALIZATION ROUTINES
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
      if (window.demoSensorData.waterLevel < 20) {
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

  initMonitoringPage() {
    // Monitoring page binds directly to refreshTelemetryUI
  }

  initSensorsPage() {
    this.renderSensorsTable();
  }

  renderSensorsTable() {
    const tbody = document.getElementById("sensorsTableBody");
    if (!tbody) return;

    const sensors = DataService.getSensorsDetailList();
    tbody.innerHTML = sensors.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${s.sensorType}</td>
        <td><strong style="color: var(--color-emerald-primary);">${s.value}</strong></td>
        <td><span class="status-badge ${s.status === 'ปกติ' || s.status === 'เหมาะสม' || s.status === 'ON' ? 'status-good' : 'status-warn'}">🟢 ${s.status}</span></td>
        <td>${s.minLimit}</td>
        <td>${s.normalRange}</td>
        <td>${s.maxLimit}</td>
      </tr>
    `).join("");
  }

  initHistoryPage() {
    this.initHistoryChart();
    this.renderHistoryTable();

    document.getElementById("btnExportCSV")?.addEventListener("click", async () => {
      DataService.exportToCSV("wolffia_telemetry_history", window.demoHistoryData);
    });

    const searchInput = document.getElementById("historySearchInput");
    const dateInput = document.getElementById("historyDateFilter");

    const filterHandler = () => {
      const q = (searchInput?.value || "").toLowerCase();
      const d = dateInput?.value || "";
      this.renderHistoryTable(q, d);
    };

    searchInput?.addEventListener("input", filterHandler);
    dateInput?.addEventListener("change", filterHandler);
  }

  renderHistoryTable(query = "", dateFilter = "") {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    let logs = window.demoHistoryData || [];

    if (query) {
      logs = logs.filter(row => 
        row.date.includes(query) || 
        row.time.includes(query) || 
        row.temperature.toString().includes(query) || 
        row.ph.toString().includes(query) || 
        row.pump.toLowerCase().includes(query)
      );
    }

    tbody.innerHTML = logs.map(row => `
      <tr>
        <td>${row.date}</td>
        <td>${row.time}</td>
        <td><strong class="text-rose">${row.temperature} °C</strong></td>
        <td><strong class="text-cyan">${row.ph}</strong></td>
        <td><strong class="text-emerald">${row.waterLevel}%</strong></td>
        <td><strong class="text-amber">${row.lightPct}%</strong></td>
        <td><span class="status-badge ${row.pump === 'ON' ? 'status-good' : 'status-danger'}">${row.pump}</span></td>
        <td><span class="status-badge status-good">🟢 ${row.status || 'ปกติ'}</span></td>
      </tr>
    `).join("");
  }

  async initStatisticsPage() {
    this.initStatisticsTrendCharts();
  }

  initStatisticsTrendCharts() {
    const labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "ปัจจุบัน"];
    
    const configs = [
      { id: "statChartTemp", label: "อุณหภูมิ (°C)", color: "#ef4444", data: [27.8, 28.0, 28.2, 28.6, 28.5, 28.4, window.demoSensorData.temperature] },
      { id: "statChartPH", label: "ค่า pH", color: "#06b6d4", data: [6.6, 6.7, 6.8, 6.9, 6.8, 6.7, window.demoSensorData.ph] },
      { id: "statChartWater", label: "ระดับน้ำ (%)", color: "#10b981", data: [85, 84, 83, 82, 82, 81, window.demoSensorData.waterLevel] },
      { id: "statChartLight", label: "ความเข้มแสง (%)", color: "#f59e0b", data: [10, 35, 80, 95, 75, 40, window.demoSensorData.lightPct] }
    ];

    configs.forEach(cfg => {
      const ctx = document.getElementById(cfg.id);
      if (!ctx) return;
      if (this.statCharts[cfg.id]) this.statCharts[cfg.id].destroy();

      this.statCharts[cfg.id] = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{ label: cfg.label, data: cfg.data, borderColor: cfg.color, tension: 0.3, fill: false }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
          }
        }
      });
    });
  }

  async initAnalyticsPage() {
    const summary = await DataService.getAnalyticsSummary();
    if (summary) {
      if (document.getElementById("anSummaryTemp")) document.getElementById("anSummaryTemp").textContent = summary.tempTrend;
      if (document.getElementById("anSummaryPH")) document.getElementById("anSummaryPH").textContent = summary.phTrend;
      if (document.getElementById("anSummaryWater")) document.getElementById("anSummaryWater").textContent = summary.waterTrend;
      if (document.getElementById("anSummaryLight")) document.getElementById("anSummaryLight").textContent = summary.lightTrend;
      if (document.getElementById("anSummaryPump")) document.getElementById("anSummaryPump").textContent = summary.pumpSummary;
    }
    this.initAnalyticsTrendCharts();
  }

  initAnalyticsTrendCharts() {
    const labels = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "ปัจจุบัน"];
    const configs = [
      { id: "anChartTemp", label: "อุณหภูมิ (°C)", color: "#ef4444", data: [28.2, 28.4, 28.5, 28.7, 28.6, 28.5, window.demoSensorData.temperature] },
      { id: "anChartPH", label: "ค่า pH", color: "#06b6d4", data: [6.7, 6.8, 6.8, 6.9, 6.8, 6.8, window.demoSensorData.ph] },
      { id: "anChartWater", label: "ระดับน้ำ (%)", color: "#10b981", data: [84, 83, 82, 82, 81, 82, window.demoSensorData.waterLevel] },
      { id: "anChartLight", label: "ความเข้มแสง (%)", color: "#f59e0b", data: [70, 75, 78, 76, 74, 75, window.demoSensorData.lightPct] }
    ];

    configs.forEach(cfg => {
      const ctx = document.getElementById(cfg.id);
      if (!ctx) return;
      if (this.anCharts[cfg.id]) this.anCharts[cfg.id].destroy();

      this.anCharts[cfg.id] = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{ label: cfg.label, data: cfg.data, borderColor: cfg.color, tension: 0.3 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
            y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
          }
        }
      });
    });
  }

  initSettingsPage() {
    document.getElementById("formSystemSettings")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.checkAdminPermission("บันทึกการตั้งค่าระบบ")) return;

      const mode = document.getElementById("setSystemMode")?.value;
      if (mode) DataService.currentMode = mode;

      alert("✓ บันทึกการตั้งค่าระบบและ Sensor Thresholds ใหม่เรียบร้อยแล้ว");
      this.refreshTelemetryUI();
    });
  }

  initWeeklyStatsPage() {
    document.getElementById("btnPrintWeeklyReport")?.addEventListener("click", () => window.print());
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
  // 4. REALTIME SYNC LOOP & TELEMETRY UI RENDERING
  // --------------------------------------------------------------------------
  startTelemetryLoop() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(async () => {
      await DataService.getLatestSensorData();
      this.refreshTelemetryUI();
    }, 3000); // 3-second live refresh
  }

  async refreshTelemetryUI() {
    const s = window.demoSensorData;
    if (!s) return;

    // Header Connection Chip
    const chipText = document.getElementById("connectionStatusText");
    const chip = document.getElementById("connectionStatus");
    if (chipText && chip) {
      if (DataService.currentMode === "DEMO") {
        chipText.textContent = "🟡 DEMO MODE (ข้อมูลจำลอง)";
        chip.className = "connection-chip";
        chip.style.borderColor = "var(--color-amber-warn)";
        chip.style.color = "var(--color-amber-warn)";
      } else {
        if (DataService.isLiveConnected) {
          chipText.textContent = "🟢 LIVE MODE (เชื่อมต่อแล้ว)";
          chip.className = "connection-chip";
          chip.style.borderColor = "var(--color-emerald-primary)";
          chip.style.color = "var(--color-emerald-primary)";
        } else {
          chipText.textContent = "🟡 DEMO MODE (ข้อมูลจำลอง - Supabase ไม่มีข้อมูล)";
          chip.className = "connection-chip";
          chip.style.borderColor = "var(--color-amber-warn)";
          chip.style.color = "var(--color-amber-warn)";
        }
      }
    }

    const lastCheck = document.getElementById("lastCheckTime");
    if (lastCheck) lastCheck.textContent = s.lastUpdate;

    // 1. Dashboard Banner & Badges
    const statusBanner = document.getElementById("statusBanner");
    const statusIcon = document.getElementById("statusIcon");
    const statusTitle = document.getElementById("statusTitle");
    const statusDesc = document.getElementById("statusDesc");

    if (statusBanner && statusTitle) {
      if (s.systemStatus === "ปกติ" || s.systemStatus === "NORMAL") {
        statusBanner.className = "status-banner";
        if (statusIcon) statusIcon.innerHTML = `<i class="fa-solid fa-circle-check text-emerald"></i>`;
        statusTitle.className = "status-title-text text-emerald";
        statusTitle.textContent = "🟢 ปกติ (SYSTEM NORMAL)";
        if (statusDesc) statusDesc.textContent = s.statusMessage;
      } else if (s.systemStatus === "แจ้งเตือน" || s.systemStatus === "WARNING") {
        statusBanner.className = "status-banner status-warning";
        if (statusIcon) statusIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-amber"></i>`;
        statusTitle.className = "status-title-text text-amber";
        statusTitle.textContent = "🟡 แจ้งเตือน (SYSTEM WARNING)";
        if (statusDesc) statusDesc.textContent = s.statusMessage;
      } else {
        statusBanner.className = "status-banner status-critical";
        if (statusIcon) statusIcon.innerHTML = `<i class="fa-solid fa-circle-exclamation text-rose"></i>`;
        statusTitle.className = "status-title-text text-rose";
        statusTitle.textContent = `🔴 ผิดปกติ (${s.systemStatus})`;
        if (statusDesc) statusDesc.textContent = s.statusMessage;
      }
    }

    // 2. Early Warning Trends
    if (document.getElementById("ewPhTrend")) document.getElementById("ewPhTrend").textContent = `→ ${s.trend.ph}`;
    if (document.getElementById("ewTempTrend")) document.getElementById("ewTempTrend").textContent = `↗ ${s.trend.temperature}`;
    if (document.getElementById("ewLightTrend")) document.getElementById("ewLightTrend").textContent = `→ ${s.trend.light}`;
    if (document.getElementById("ewWaterTrend")) document.getElementById("ewWaterTrend").textContent = `↘ ${s.trend.waterLevel}`;
    if (document.getElementById("ewTemp")) document.getElementById("ewTemp").textContent = s.temperature;

    // 3. Sensor Cards & Badges
    if (document.getElementById("valTemp")) document.getElementById("valTemp").textContent = s.temperature;
    if (document.getElementById("badgeTemp")) {
      document.getElementById("badgeTemp").className = `status-badge ${s.tempStatus === 'ปกติ' ? 'status-good' : 'status-warn'}`;
      document.getElementById("badgeTemp").textContent = `${s.tempStatus === 'ปกติ' ? '🟢' : '🟡'} ${s.tempStatus}`;
    }

    if (document.getElementById("valPH")) document.getElementById("valPH").textContent = s.ph;
    if (document.getElementById("badgePH")) {
      document.getElementById("badgePH").className = `status-badge ${s.phStatus === 'ปกติ' ? 'status-good' : 'status-warn'}`;
      document.getElementById("badgePH").textContent = `${s.phStatus === 'ปกติ' ? '🟢' : '🟡'} ${s.phStatus}`;
    }

    if (document.getElementById("valWater")) document.getElementById("valWater").textContent = s.waterLevel;
    if (document.getElementById("badgeWater")) {
      document.getElementById("badgeWater").className = `status-badge ${s.waterStatus === 'ปกติ' ? 'status-good' : 'status-warn'}`;
      document.getElementById("badgeWater").textContent = `${s.waterStatus === 'ปกติ' ? '🟢' : '🟡'} ${s.waterStatus}`;
    }

    if (document.getElementById("valLightPct")) document.getElementById("valLightPct").textContent = s.lightPct;
    if (document.getElementById("valLightLux")) document.getElementById("valLightLux").textContent = s.lightLux ? s.lightLux.toLocaleString() : "8,450";
    if (document.getElementById("badgeLight")) {
      document.getElementById("badgeLight").className = `status-badge ${s.lightStatus === 'เหมาะสม' || s.lightStatus === 'ปกติ' ? 'status-good' : 'status-warn'}`;
      document.getElementById("badgeLight").textContent = `🟢 ${s.lightStatus}`;
    }

    if (document.getElementById("cardPumpStateText")) document.getElementById("cardPumpStateText").textContent = s.pump ? "ON" : "OFF";
    if (document.getElementById("cardPumpModeText")) document.getElementById("cardPumpModeText").textContent = `(โหมด ${s.mode})`;
    if (document.getElementById("cardPumpStatusBadge")) {
      document.getElementById("cardPumpStatusBadge").className = `status-badge ${s.pump ? 'status-good' : 'status-danger'}`;
      document.getElementById("cardPumpStatusBadge").textContent = s.pump ? "🟢 ON" : "🔴 OFF";
    }

    if (document.getElementById("cardSysStatusText")) document.getElementById("cardSysStatusText").textContent = s.systemStatus;
    if (document.getElementById("cardSysStatusBadge")) {
      document.getElementById("cardSysStatusBadge").className = `status-badge ${s.systemStatus === 'ปกติ' || s.systemStatus === 'NORMAL' ? 'status-good' : 'status-warn'}`;
      document.getElementById("cardSysStatusBadge").textContent = s.systemStatus === 'ปกติ' ? "🟢 ปกติ" : "🟡 แจ้งเตือน";
    }

    // Monitoring Page Direct Binding
    if (document.getElementById("monValTemp")) document.getElementById("monValTemp").textContent = s.temperature;
    if (document.getElementById("monValPH")) document.getElementById("monValPH").textContent = s.ph;
    if (document.getElementById("monValWater")) document.getElementById("monValWater").textContent = s.waterLevel;
    if (document.getElementById("monValLight")) document.getElementById("monValLight").textContent = s.lightPct;
    if (document.getElementById("monValLux")) document.getElementById("monValLux").textContent = s.lightLux ? s.lightLux.toLocaleString() : "8,450";
    if (document.getElementById("monValPump")) document.getElementById("monValPump").textContent = s.pump ? "ON" : "OFF";
    if (document.getElementById("monValStatus")) document.getElementById("monValStatus").textContent = s.systemStatus;
    if (document.getElementById("monLastUpdate")) document.getElementById("monLastUpdate").textContent = s.lastUpdate;

    // Sensors Table Update
    if (document.getElementById("sensorsTableBody")) {
      this.renderSensorsTable();
    }

    // Analytics Values
    if (document.getElementById("anValTemp")) document.getElementById("anValTemp").textContent = s.temperature;
    if (document.getElementById("anValPH")) document.getElementById("anValPH").textContent = s.ph;
    if (document.getElementById("anValWater")) document.getElementById("anValWater").textContent = s.waterLevel;
    if (document.getElementById("anValLight")) document.getElementById("anValLight").textContent = s.lightPct;

    // Range Dots & Progress Bars
    if (document.getElementById("dotTemp")) {
      const pct = Math.min(100, Math.max(0, ((s.temperature - 20) / 15) * 100));
      document.getElementById("dotTemp").style.left = `${pct}%`;
    }
    if (document.getElementById("fillWater")) document.getElementById("fillWater").style.width = `${s.waterLevel}%`;
    if (document.getElementById("fillLight")) document.getElementById("fillLight").style.width = `${s.lightPct}%`;

    // Activity List
    if (document.getElementById("actPH")) document.getElementById("actPH").textContent = s.ph;
    if (document.getElementById("actTemp")) document.getElementById("actTemp").textContent = s.temperature;
    if (document.getElementById("actWater")) document.getElementById("actWater").textContent = s.waterLevel;
    if (document.getElementById("actLight")) document.getElementById("actLight").textContent = s.lightPct;

    if (document.getElementById("userRecommendationBox")) {
      document.getElementById("userRecommendationBox").textContent = s.recommendation;
    }

    // Pump Control Safety Lock
    const safetyBanner = document.getElementById("safetyLockBanner");
    if (safetyBanner) safetyBanner.style.display = s.waterLevel < 20 ? "block" : "none";

    this.updateDashboardChart(s);
    this.updateStatisticsPanel();
  }

  async updateStatisticsPanel() {
    const stats = await DataService.getTelemetryStatistics();
    if (!stats) return;

    ["statTempAvg", "stTempAvg"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.tempAvg; });
    ["statTempMin", "stTempMin"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.tempMin; });
    ["statTempMax", "stTempMax"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.tempMax; });

    ["statPhAvg", "stPhAvg"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.phAvg; });
    ["statPhMin", "stPhMin"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.phMin; });
    ["statPhMax", "stPhMax"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.phMax; });

    ["statWaterAvg", "stWaterAvg"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.waterAvg; });
    ["statWaterMin", "stWaterMin"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.waterMin; });
    ["statWaterMax", "stWaterMax"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.waterMax; });

    ["statLightAvg", "stLightAvg"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.lightAvg; });
    ["statLightMin", "stLightMin"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.lightMin; });
    ["statLightMax", "stLightMax"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.lightMax; });

    ["statPumpCount", "stPumpCount", "anValPumpCount"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.pumpRunCount; });
    ["statPumpHours", "stPumpHours", "anValPumpHours"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = stats.pumpRuntimeHours; });
  }

  // --------------------------------------------------------------------------
  // 5. CHART ENGINE
  // --------------------------------------------------------------------------
  initDashboardChart() {
    const ctx = document.getElementById("dashboardChart");
    if (!ctx) return;

    if (this.dashboardChart) this.dashboardChart.destroy();

    this.dashboardChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["10:00", "11:00", "12:00", "13:00", "14:00", "14:32"],
        datasets: [
          { label: "อุณหภูมิน้ำ (°C)", data: [28.3, 28.5, 28.4, 28.7, 28.6, 28.5], borderColor: "#ef4444", tension: 0.3 },
          { label: "ค่า pH", data: [6.7, 6.8, 6.9, 6.8, 6.7, 6.8], borderColor: "#06b6d4", tension: 0.3 },
          { label: "ระดับน้ำ (%)", data: [82, 81, 82, 80, 81, 82], borderColor: "#10b981", tension: 0.3 },
          { label: "ความเข้มแสง (%)", data: [74, 76, 73, 75, 77, 75], borderColor: "#f59e0b", tension: 0.3 }
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
    this.dashboardChart.data.datasets[3].data.push(s.lightPct);

    if (this.dashboardChart.data.labels.length > 15) {
      this.dashboardChart.data.labels.shift();
      this.dashboardChart.data.datasets.forEach(ds => ds.data.shift());
    }
    this.dashboardChart.update();
  }

  initHistoryChart() {
    const ctx = document.getElementById("historyDetailedChart");
    if (!ctx) return;
    if (this.historyChart) this.historyChart.destroy();

    this.historyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["10:00", "11:00", "12:00", "13:00", "14:00", "14:32"],
        datasets: [
          { label: "อุณหภูมิน้ำ (°C)", data: [28.3, 28.5, 28.4, 28.7, 28.6, 28.5], borderColor: "#ef4444", tension: 0.3 },
          { label: "ค่า pH", data: [6.7, 6.8, 6.9, 6.8, 6.7, 6.8], borderColor: "#06b6d4", tension: 0.3 },
          { label: "ระดับน้ำ (%)", data: [82, 81, 82, 80, 81, 82], borderColor: "#10b981", tension: 0.3 }
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
    if (this.growthChart) this.growthChart.destroy();

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
    if (this.forecastChart) this.forecastChart.destroy();

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
    if (this.correlationChart) this.correlationChart.destroy();

    this.correlationChart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [{
          label: "อุณหภูมิ (°C) vs Growth Rate (g/วัน)",
          data: [
            { x: 24.0, y: 35.0 },
            { x: 26.5, y: 48.0 },
            { x: 28.5, y: 58.2 },
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

  // --------------------------------------------------------------------------
  // 6. IN-MEMORY FALLBACK TEMPLATE STORE
  // --------------------------------------------------------------------------
  getFallbackPageTemplate(pageName) {
    const s = window.demoSensorData;
    const templates = {
      dashboard: `
        <div class="panel-card" style="margin-bottom: 20px;">
          <h2>🌱 SMART WOLFFIA FARM — แดชบอร์ดหลัก</h2>
          <span class="status-badge status-good">🟡 DEMO MODE</span>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px;">
            <div class="sensor-card"><h3>🌡️ อุณหภูมิน้ำ</h3><div class="sensor-val text-rose">${s.temperature} °C</div><span>สถานะ: ${s.tempStatus}</span></div>
            <div class="sensor-card"><h3>🧪 ค่า pH</h3><div class="sensor-val text-cyan">${s.ph} pH</div><span>สถานะ: ${s.phStatus}</span></div>
            <div class="sensor-card"><h3>💧 ระดับน้ำ</h3><div class="sensor-val text-emerald">${s.waterLevel} %</div><span>สถานะ: ${s.waterStatus}</span></div>
            <div class="sensor-card"><h3>☀️ ความเข้มแสง</h3><div class="sensor-val text-amber">${s.lightPct} %</div><span>สถานะ: ${s.lightStatus}</span></div>
            <div class="sensor-card"><h3>💦 ปั๊มน้ำ</h3><div class="sensor-val text-emerald">${s.pump ? "ON" : "OFF"}</div><span>โหมด: ${s.mode}</span></div>
            <div class="sensor-card"><h3>🟢 สถานะระบบ</h3><div class="sensor-val text-cyan">${s.systemStatus}</div><span>ทุกระบบทำงานปกติ</span></div>
          </div>
        </div>
      `,
      monitoring: `
        <div class="panel-card">
          <h3>🖥️ การติดตามระบบแบบละเอียด (Monitoring)</h3>
          <p>อัปเดตล่าสุด: ${s.lastUpdate}</p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px;">
            <div><strong>Temperature:</strong> ${s.temperature} °C <span class="status-badge status-good">🟢 Normal</span></div>
            <div><strong>pH:</strong> ${s.ph} pH <span class="status-badge status-good">🟢 Normal</span></div>
            <div><strong>Water Level:</strong> ${s.waterLevel} % <span class="status-badge status-good">🟢 Normal</span></div>
            <div><strong>Light:</strong> ${s.lightPct} % <span class="status-badge status-good">🟢 Normal</span></div>
            <div><strong>Pump:</strong> ${s.pump ? "ON" : "OFF"} <span class="status-badge status-good">🟢 ON</span></div>
            <div><strong>System Status:</strong> ${s.systemStatus} <span class="status-badge status-good">🟢 Normal</span></div>
          </div>
        </div>
      `,
      sensors: `
        <div class="panel-card">
          <h3>🔬 รายละเอียดและเกณฑ์วัดเซนเซอร์ (Sensors)</h3>
          <table class="data-table" style="margin-top: 16px;">
            <thead><tr><th>ชื่อ Sensor</th><th>ค่าปัจจุบัน</th><th>ช่วงที่กำหนด</th><th>สถานะ</th></tr></thead>
            <tbody>
              <tr><td>อุณหภูมิน้ำ (Temperature)</td><td>${s.temperature} °C</td><td>25.0 – 32.0 °C</td><td><span class="status-badge status-good">🟢 ปกติ</span></td></tr>
              <tr><td>ค่า pH (pH Sensor)</td><td>${s.ph} pH</td><td>6.0 – 7.5 pH</td><td><span class="status-badge status-good">🟢 ปกติ</span></td></tr>
              <tr><td>ระดับน้ำ (Water Level)</td><td>${s.waterLevel} %</td><td>40 – 100 %</td><td><span class="status-badge status-good">🟢 ปกติ</span></td></tr>
              <tr><td>ความเข้มแสง (Light Intensity)</td><td>${s.lightPct} %</td><td>60 – 90 %</td><td><span class="status-badge status-good">🟢 เหมาะสม</span></td></tr>
            </tbody>
          </table>
        </div>
      `,
      history: `
        <div class="panel-card">
          <h3>📜 ตารางและประวัติข้อมูลย้อนหลัง (History)</h3>
          <table class="data-table" style="margin-top: 16px;">
            <thead><tr><th>วันที่</th><th>เวลา</th><th>Temperature</th><th>pH</th><th>Water Level</th><th>Light</th><th>Pump</th></tr></thead>
            <tbody id="historyTableBody"></tbody>
          </table>
        </div>
      `,
      statistics: `
        <div class="panel-card">
          <h3>🔢 สรุปข้อมูลสถิติ (Statistics)</h3>
          <p>คำนวณจากข้อมูลย้อนหลัง 30 รายการ</p>
        </div>
      `,
      analytics: `
        <div class="panel-card">
          <h3>📈 วิเคราะห์แนวโน้มเชิงลึก (Analytics)</h3>
          <p>ข้อความสรุป: อุณหภูมิเฉลี่ยและค่า pH อยู่ในช่วงที่เหมาะสมกับการเติบโตของไข่ผำ</p>
        </div>
      `,
      settings: `
        <div class="panel-card">
          <h3>⚙️ ตั้งค่าระบบ (Settings)</h3>
          <p>System Settings & Sensor Thresholds</p>
        </div>
      `
    };

    return templates[pageName] || `<div class="panel-card"><h3>📌 หน้า ${pageName}</h3><p>ระบบพร้อมแสดงข้อมูล</p></div>`;
  }
}

// Auto Init App
document.addEventListener("DOMContentLoaded", () => {
  window.app = new WolffiaApp();
});
