/**
 * SMART WOLFFIA FARM V3 — APPLICATION CONTROLLER
 * Full-Stack Client Logic, Router, Supabase Auth/RBAC, Telemetry UI & Security Layer
 */

class WolffiaApp {
  constructor() {
    this.currentUser = typeof AuthService !== "undefined" ? AuthService.getCurrentUser() : (JSON.parse(sessionStorage.getItem("wolffia_user")) || {
      email: "public@wolffia.farm",
      role: "public",
      display_name: "Public Viewer"
    });

    this.activePage = "dashboard";
    this.dashboardChart = null;
    this.growthChart = null;
    this.historyChart = null;
    this.forecastChart = null;
    this.correlationChart = null;
    
    this.statCharts = {};
    this.anCharts = {};
    this.syncTimer = null;

    this.init();
  }

  async init() {
    console.log("[WolffiaApp] Starting Smart Wolffia Farm V3 App...");

    if (typeof AuthService !== "undefined") {
      this.currentUser = AuthService.getCurrentUser();
    }

    this.updateUserUI();
    this.bindGlobalEvents();
    this.initRouter();
    this.startTelemetryLoop();
  }

  // --------------------------------------------------------------------------
  // 1. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // --------------------------------------------------------------------------
  updateUserUI() {
    if (typeof AuthService !== "undefined") {
      this.currentUser = AuthService.getCurrentUser();
    }

    const avatar = document.getElementById("navUserAvatar");
    const name = document.getElementById("navUserName");
    const role = document.getElementById("navUserRole");
    const btnLogout = document.getElementById("btnLogout");

    if (this.currentUser) {
      if (avatar) avatar.textContent = (this.currentUser.display_name || "A").charAt(0).toUpperCase();
      if (name) name.textContent = this.currentUser.display_name || this.currentUser.email;
      if (role) {
        const rUpper = (this.currentUser.role || "PUBLIC").toUpperCase();
        role.textContent = rUpper === "PUBLIC" ? "PUBLIC VIEWER" : rUpper;
        role.className = `user-role-tag role-${this.currentUser.role}`;
      }

      if (btnLogout) {
        if (this.currentUser.role === "public") {
          btnLogout.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> เข้าสู่ระบบ (Login)`;
        } else {
          btnLogout.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> ออกจากระบบ`;
        }
      }

      const isAdmin = this.currentUser.role === "admin";
      ["navControl", "navCalibration", "navUsers", "navSettings", "navAudit"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isAdmin ? "block" : "none";
      });
    }

    this.updateDebugPanel();
  }

  checkAdminPermission(actionName) {
    if (!this.currentUser || this.currentUser.role !== "admin") {
      alert(`⛔ ปฏิเสธคำสั่ง (403 Forbidden)\n\nฟังก์ชันนี้สำหรับผู้ดูแลระบบ (ADMIN) เท่านั้น\nไม่สามารถดำเนินการ: ${actionName}`);
      DataService.logAudit(actionName, "RBAC_CHECK", "DENIED");
      return false;
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // 2. SPA HASH ROUTER & GLOBAL EVENT HANDLERS
  // --------------------------------------------------------------------------
  initRouter() {
    const handleHash = () => {
      const hash = window.location.hash.replace("#/", "").replace("#", "").trim();
      const page = hash || "dashboard";
      this.loadPage(page);
    };

    window.addEventListener("hashchange", handleHash);

    // Initial Route Load
    const initialPage = window.location.hash.replace("#/", "").replace("#", "").trim() || "dashboard";
    this.loadPage(initialPage);
  }

  bindGlobalEvents() {
    // Robust Sidebar Navigation Click Handler (Event Delegation & currentTarget fix)
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const navItem = e.currentTarget;
        const page = navItem.getAttribute("data-page");
        if (page) {
          window.location.hash = `#/${page}`;
          // Close Mobile Drawer on Navigation
          const sidebar = document.querySelector(".sidebar");
          if (sidebar) sidebar.classList.remove("open");
        }
      });
    });

    document.getElementById("btnLogout")?.addEventListener("click", () => {
      if (typeof AuthService !== "undefined") {
        AuthService.signOut();
      } else {
        sessionStorage.removeItem("wolffia_user");
        window.location.href = "login.html";
      }
    });

    // Mobile Sidebar Toggle
    document.getElementById("btnMobileSidebarToggle")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) sidebar.classList.toggle("open");
    });

    // Toggle Buttons for DEMO MODE / LIVE MODE
    document.getElementById("btnModeDemo")?.addEventListener("click", () => {
      DataService.currentMode = "DEMO";
      document.getElementById("btnModeDemo")?.classList.add("active");
      document.getElementById("btnModeLive")?.classList.remove("active");
      if (document.getElementById("presetSelector")) document.getElementById("presetSelector").style.display = "inline-block";
      this.refreshTelemetryUI();
    });

    document.getElementById("btnModeLive")?.addEventListener("click", async () => {
      DataService.currentMode = "LIVE";
      document.getElementById("btnModeLive")?.classList.add("active");
      document.getElementById("btnModeDemo")?.classList.remove("active");
      if (document.getElementById("presetSelector")) document.getElementById("presetSelector").style.display = "none";
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
    // Admin Protected Routes Guard
    const adminOnlyPages = ["control", "calibration", "users", "settings", "audit-log"];
    if (adminOnlyPages.includes(pageName) && this.currentUser.role !== "admin") {
      alert(`⛔ ปฏิเสธการเข้าถึง (${pageName})\n\nหน้านี้เปิดให้เฉพาะผู้ดูแลระบบ (ADMIN) เข้าใช้งานเท่านั้น`);
      window.location.hash = "#/dashboard";
      return;
    }

    this.activePage = pageName;

    // Update Active Nav Item Highlight
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(el => {
      if (el.getAttribute("data-page") === pageName) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });

    const outlet = document.getElementById("pageOutlet");
    if (!outlet) return;

    outlet.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-sub);"><i class="fa-solid fa-spinner fa-spin fa-2x text-emerald"></i><p style="margin-top: 12px;">กำลังโหลดข้อมูล...</p></div>`;

    let loadedContent = "";
    try {
      const res = await fetch(`pages/${pageName}.html`);
      if (res.ok) {
        loadedContent = await res.text();
      }
    } catch (e) {
      console.warn(`[Router] Direct fetch failed for ${pageName}, attempting fallback template.`, e);
    }

    if (loadedContent) {
      outlet.innerHTML = loadedContent;
    } else {
      outlet.innerHTML = this.getFallbackPageTemplate(pageName);
    }

    this.bindPageEvents(pageName);
    this.refreshTelemetryUI();
    this.updateDebugPanel();
  }

  updateDebugPanel() {
    const user = this.currentUser || { email: "public@wolffia.farm", role: "public" };
    if (document.getElementById("dbgAuthStatus")) document.getElementById("dbgAuthStatus").textContent = user.role !== "public" ? "SIGNED IN" : "PUBLIC";
    if (document.getElementById("dbgUserEmail")) document.getElementById("dbgUserEmail").textContent = user.email || "public@wolffia.farm";
    if (document.getElementById("dbgUserRole")) document.getElementById("dbgUserRole").textContent = (user.role || "public").toUpperCase();
    if (document.getElementById("dbgCurrentRoute")) document.getElementById("dbgCurrentRoute").textContent = `/#/${this.activePage || "dashboard"}`;
    if (document.getElementById("dbgSupabaseStatus")) document.getElementById("dbgSupabaseStatus").textContent = DataService.isLiveConnected ? "CONNECTED" : "WAITING";
    if (document.getElementById("dbgEsp32Status")) document.getElementById("dbgEsp32Status").textContent = DataService.isLiveConnected ? "ONLINE" : "CHECKING";
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
    } else if (pageName === "growth") {
      this.initGrowthPage();
    } else if (pageName === "harvest") {
      this.initHarvestPage();
    } else if (pageName === "nutrients") {
      this.initNutrientsPage();
    } else if (pageName === "control") {
      this.initControlPage();
    } else if (pageName === "calibration") {
      this.initCalibrationPage();
    } else if (pageName === "users") {
      this.initUsersPage();
    } else if (pageName === "settings") {
      this.initSettingsPage();
    } else if (pageName === "audit-log") {
      this.initAuditLogPage();
    } else if (pageName === "weekly-stats") {
      this.initWeeklyStatsPage();
    } else if (pageName === "monthly-stats") {
      this.initMonthlyStatsPage();
    } else if (pageName === "batches") {
      this.initBatchesPage();
    } else if (pageName === "sales") {
      this.initSalesPage();
    } else if (pageName === "forecast") {
      this.initForecastChart();
    } else if (pageName === "correlation") {
      this.initCorrelationChart();
    }
  }

  // --------------------------------------------------------------------------
  // 3. PAGE SPECIFIC CONTROLLERS & EVENT BINDINGS
  // --------------------------------------------------------------------------
  initDashboardPage() {
    document.getElementById("btnOpenPhModal")?.addEventListener("click", () => {
      document.getElementById("modalPH")?.classList.add("active");
    });

    document.getElementById("btnModeAuto")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("เปลี่ยนโหมดเป็น AUTO")) return;
      await DataService.setSystemMode("AUTO");
      this.refreshTelemetryUI();
    });

    document.getElementById("btnModeManual")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("เปลี่ยนโหมดเป็น MANUAL")) return;
      await DataService.setSystemMode("MANUAL");
      this.refreshTelemetryUI();
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
        alert(res.message);
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

  initMonitoringPage() {}

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

  async initHistoryPage() {
    this.initHistoryChart();
    await this.renderHistoryTable();

    document.getElementById("btnExportCSV")?.addEventListener("click", async () => {
      const logs = await DataService.getSensorHistory("24h");
      DataService.exportToCSV("wolffia_telemetry_history", logs);
    });
  }

  async renderHistoryTable(query = "", dateFilter = "") {
    const tbody = document.getElementById("historyTableBody");
    if (!tbody) return;

    let logs = await DataService.getSensorHistory("24h");

    if (query) {
      logs = logs.filter(row => 
        row.date.includes(query) || 
        row.time.includes(query) || 
        row.temperature.toString().includes(query) || 
        row.ph.toString().includes(query)
      );
    }

    if (!logs || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">ยังไม่มีข้อมูลจากอุปกรณ์</td></tr>`;
      return;
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
        <td><span class="status-badge status-good">🟢 ${row.status || 'NORMAL'}</span></td>
      </tr>
    `).join("");
  }

  async initGrowthPage() {
    const form = document.getElementById("formGrowth");
    const badge = document.getElementById("adminGrowthBadge");
    const isAdmin = this.currentUser.role === "admin";

    if (badge) badge.style.display = isAdmin ? "inline-block" : "none";
    if (form) {
      if (!isAdmin) {
        form.querySelectorAll("input, button").forEach(el => el.disabled = true);
      }
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!this.checkAdminPermission("บันทึกข้อมูลการเจริญเติบโต")) return;

        const record = {
          record_date: document.getElementById("growthDate").value,
          coverage_pct: parseFloat(document.getElementById("growthCoverage").value),
          fresh_weight_g: parseFloat(document.getElementById("growthWeight").value),
          notes: document.getElementById("growthNote").value
        };

        await DataService.addGrowthRecord(record);
        alert("✓ บันทึกข้อมูลการเจริญเติบโตใหม่เรียบร้อยแล้ว");
        this.renderGrowthTable();
      });
    }
    this.renderGrowthTable();
  }

  initBatchesPage() {
    const ctx = document.getElementById("batchGrowthChart");
    if (!ctx) return;
    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["01/09 (เริ่ม)", "03/09", "05/09", "07/09", "10/09", "14/09 (เก็บเกี่ยว)"],
        datasets: [
          { label: "ความครอบคลุมผิวน้ำ (%)", data: [15, 21, 28, 42, 65, 88], borderColor: "#06b6d4", yAxisID: "y" },
          { label: "น้ำหนักสดประเมิน (g)", data: [100, 145, 190, 320, 580, 890], borderColor: "#10b981", yAxisID: "y1" }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { position: "left", title: { display: true, text: "Coverage (%)", color: "#06b6d4" }, ticks: { color: "#06b6d4" } },
          y1: { position: "right", title: { display: true, text: "Weight (g)", color: "#10b981" }, ticks: { color: "#10b981" }, grid: { drawOnChartArea: false } }
        }
      }
    });
  }

  async renderGrowthTable() {
    const tbody = document.getElementById("growthTableBody");
    if (!tbody) return;

    const records = await DataService.getGrowthRecords();
    tbody.innerHTML = records.map(r => `
      <tr>
        <td>${r.record_date}</td>
        <td>${r.coverage_pct}%</td>
        <td><strong class="text-emerald">${r.fresh_weight_g} g</strong></td>
        <td><span class="text-emerald">+${r.growth_rate_g_day || 0}g</span></td>
        <td>${r.notes || '-'}</td>
      </tr>
    `).join("");
  }

  async initHarvestPage() {
    const form = document.getElementById("formHarvest");
    const badge = document.getElementById("adminHarvestBadge");
    const isAdmin = this.currentUser.role === "admin";

    if (badge) badge.style.display = isAdmin ? "inline-block" : "none";
    if (form) {
      if (!isAdmin) form.querySelectorAll("input, button").forEach(el => el.disabled = true);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!this.checkAdminPermission("บันทึกข้อมูลการเก็บเกี่ยว")) return;

        const record = {
          harvest_date: document.getElementById("harvestDate").value,
          fresh_weight_g: parseFloat(document.getElementById("harvestWeight").value),
          coverage_before_pct: parseFloat(document.getElementById("harvestCoverageBefore").value),
          notes: document.getElementById("harvestNote").value
        };

        await DataService.addHarvestRecord(record);
        alert("✓ บันทึกข้อมูลการเก็บเกี่ยวเรียบร้อยแล้ว");
        this.renderHarvestTable();
      });
    }
    this.renderHarvestTable();
  }

  async renderHarvestTable() {
    const tbody = document.getElementById("harvestTableBody");
    if (!tbody) return;

    const records = await DataService.getHarvestRecords();
    tbody.innerHTML = records.map(r => `
      <tr>
        <td>${r.harvest_date}</td>
        <td><strong class="text-emerald">${r.fresh_weight_g} g (${(r.fresh_weight_g / 1000).toFixed(2)} kg)</strong></td>
        <td>${r.coverage_before_pct || '-'}%</td>
        <td>${r.notes || '-'}</td>
      </tr>
    `).join("");
  }

  async initNutrientsPage() {
    const form = document.getElementById("formNutrient");
    const badge = document.getElementById("adminNutrientBadge");
    const isAdmin = this.currentUser.role === "admin";

    if (badge) badge.style.display = isAdmin ? "inline-block" : "none";
    if (form) {
      if (!isAdmin) form.querySelectorAll("input, button").forEach(el => el.disabled = true);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!this.checkAdminPermission("บันทึกการเติมสารอาหาร")) return;

        const record = {
          nutrient_date: document.getElementById("nutrientDate").value,
          nutrient_type: document.getElementById("nutrientType").value,
          amount_g: parseFloat(document.getElementById("nutrientAmount").value),
          notes: document.getElementById("nutrientNote").value
        };

        await DataService.addNutrientRecord(record);
        alert("✓ บันทึกข้อมูลการเติมสารอาหารเรียบร้อยแล้ว");
        this.renderNutrientTable();
      });
    }
    this.renderNutrientTable();
  }

  async renderNutrientTable() {
    const tbody = document.getElementById("nutrientTableBody");
    if (!tbody) return;

    const records = await DataService.getNutrientRecords();
    tbody.innerHTML = records.map(r => `
      <tr>
        <td>${r.nutrient_date}</td>
        <td><strong>${r.nutrient_type}</strong></td>
        <td><strong class="text-cyan">${r.amount_g} g/ml</strong></td>
        <td>${r.notes || '-'}</td>
        <td>Admin</td>
      </tr>
    `).join("");
  }

  initControlPage() {
    const isAdmin = this.currentUser && this.currentUser.role === "admin";
    const badgeText = document.getElementById("controlRoleText");
    if (badgeText) {
      badgeText.textContent = isAdmin ? "ADMIN ACCESS" : "READ ONLY (PUBLIC/VIEWER)";
    }

    document.getElementById("btnCtrlModeAuto")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("เปลี่ยนโหมดเป็น AUTO")) return;
      const res = await DataService.setSystemMode("AUTO");
      alert(res.message);
      this.refreshTelemetryUI();
    });

    document.getElementById("btnCtrlModeManual")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("เปลี่ยนโหมดเป็น MANUAL")) return;
      const res = await DataService.setSystemMode("MANUAL");
      alert(res.message);
      this.refreshTelemetryUI();
    });

    document.getElementById("btnCtrlPumpOn")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("เปิดปั๊มน้ำ")) return;
      if (confirm("คุณต้องการ ยืนยันเปิดปั๊มน้ำหมุนเวียน หรือไม่?")) {
        const res = await DataService.setPumpState(true);
        if (!res.success) {
          if (res.reason === "SAFETY_LOCK") {
            document.getElementById("modalSafetyAlert")?.classList.add("active");
          } else {
            alert(`⛔ ${res.message}`);
          }
        } else {
          alert(`✅ ${res.message}`);
        }
        this.refreshTelemetryUI();
      }
    });

    document.getElementById("btnCtrlPumpOff")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("ปิดปั๊มน้ำ")) return;
      const res = await DataService.setPumpState(false);
      alert(res.message || "ปิดปั๊มน้ำเรียบร้อย");
      this.refreshTelemetryUI();
    });

    document.getElementById("btnCtrlEmergencyStop")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("สั่งหยุดฉุกเฉิน")) return;
      if (confirm("🚨 ยืนยันการกดสั่ง EMERGENCY STOP หรือไม่?\nระบบจะตัดการทำงานของปั๊มน้ำทันที")) {
        const res = await DataService.setEmergencyStop();
        alert(res.message);
        this.refreshTelemetryUI();
      }
    });

    document.getElementById("btnCtrlEmergencyReset")?.addEventListener("click", async () => {
      if (!this.checkAdminPermission("รีเซ็ตระบบฉุกเฉิน")) return;
      const res = await DataService.setEmergencyReset();
      alert(res.message);
      this.refreshTelemetryUI();
    });
  }

  initCalibrationPage() {
    const isAdmin = this.currentUser && this.currentUser.role === "admin";
    const badgeText = document.getElementById("calibRoleText");
    if (badgeText) {
      badgeText.textContent = isAdmin ? "ADMIN ACCESS" : "READ ONLY (PUBLIC/VIEWER)";
    }

    document.getElementById("formCalibPH")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this.checkAdminPermission("บันทึกการสอบเทียบ pH")) return;
      const voltage = parseFloat(document.getElementById("calibPhVoltage").value);
      const slope = parseFloat(document.getElementById("calibPhSlope").value);
      if (confirm(`ยืนยันบันทึกค่าสอบเทียบ pH (Voltage: ${voltage}V, Slope: ${slope}) ไปยัง ESP32 หรือไม่?`)) {
        const res = await DataService.calibratePH(voltage, slope);
        alert(res.message);
      }
    });

    document.getElementById("formCalibTank")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this.checkAdminPermission("บันทึกการสอบเทียบระดับน้ำ")) return;
      const empty = parseFloat(document.getElementById("calibTankEmpty").value);
      const full = parseFloat(document.getElementById("calibTankFull").value);
      if (confirm(`ยืนยันบันทึกค่าสอบเทียบระดับน้ำ (Empty: ${empty}cm, Full: ${full}cm) ไปยัง ESP32 หรือไม่?`)) {
        const res = await DataService.calibrateTank(empty, full);
        alert(res.message);
      }
    });
  }

  initUsersPage() {
    if (!this.checkAdminPermission("เข้าถึงการจัดการผู้ใช้งาน")) return;
  }

  initSettingsPage() {
    const form = document.getElementById("formSystemSettings");
    if (form) {
      if (this.currentUser.role !== "admin") {
        form.querySelectorAll("input, select, button").forEach(el => el.disabled = true);
      }
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!this.checkAdminPermission("บันทึกการตั้งค่าระบบ")) return;

        const mode = document.getElementById("setSystemMode")?.value;
        if (mode) DataService.currentMode = mode;

        alert("✓ บันทึกการตั้งค่าระบบและ Sensor Thresholds ใหม่เรียบร้อยแล้ว");
        this.refreshTelemetryUI();
      });
    }
  }

  initAuditLogPage() {
    if (!this.checkAdminPermission("เข้าถึง Audit Logs")) return;
  }

  initWeeklyStatsPage() {
    document.getElementById("btnPrintWeeklyReport")?.addEventListener("click", () => window.print());
  }

  initMonthlyStatsPage() {}

  initSalesPage() {}

  async initStatisticsPage() {
    this.initStatisticsTrendCharts();
  }

  initStatisticsTrendCharts() {
    const labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "ปัจจุบัน"];
    const s = window.demoSensorData;
    const configs = [
      { id: "statChartTemp", label: "อุณหภูมิ (°C)", color: "#ef4444", data: [27.8, 28.0, 28.2, 28.6, 28.5, 28.4, s.temperature] },
      { id: "statChartPH", label: "ค่า pH", color: "#06b6d4", data: [6.1, 6.2, 6.2, 6.3, 6.2, 6.2, s.ph] },
      { id: "statChartWater", label: "ระดับน้ำ (%)", color: "#10b981", data: [70, 69, 69, 68, 68, 68, s.waterLevel] },
      { id: "statChartLight", label: "ความเข้มแสง (%)", color: "#f59e0b", data: [10, 35, 80, 95, 75, 40, s.lightPct] }
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
  }

  // --------------------------------------------------------------------------
  // 4. REALTIME SYNC LOOP & TELEMETRY UI RENDERING
  // --------------------------------------------------------------------------
  startTelemetryLoop() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(async () => {
      await DataService.getLatestSensorData();
      this.refreshTelemetryUI();
    }, 3000);
  }

  async refreshTelemetryUI() {
    const s = window.demoSensorData;
    if (!s) return;

    // Header Badge & Last Updated
    const chipText = document.getElementById("connectionStatusText");
    const chip = document.getElementById("connectionStatus");
    const headerLast = document.getElementById("headerLastUpdated");

    if (headerLast) headerLast.textContent = s.lastUpdate;

    if (chipText && chip) {
      if (DataService.currentMode === "DEMO") {
        chipText.textContent = "🟡 DEMO MODE (ข้อมูลจำลอง)";
        chip.style.borderColor = "var(--color-amber-warn)";
        chip.style.color = "var(--color-amber-warn)";
      } else {
        if (s.systemStatus === "DATA STALE") {
          chipText.textContent = "🟡 DATA STALE (ไม่มีข้อมูลใหม่จากอุปกรณ์)";
          chip.style.borderColor = "var(--color-amber-warn)";
          chip.style.color = "var(--color-amber-warn)";
        } else if (s.systemStatus === "DEVICE OFFLINE" || s.deviceStatus === "OFFLINE") {
          chipText.textContent = "🔴 OFFLINE (ไม่พบข้อมูลล่าสุด)";
          chip.style.borderColor = "var(--color-rose-danger)";
          chip.style.color = "var(--color-rose-danger)";
        } else if (s.systemStatus === "WAITING FOR DATA" || s.systemStatus === "NO DATA") {
          chipText.textContent = "🟡 WAITING FOR DATA (เชื่อมระบบแล้วแต่ยังไม่มีข้อมูล)";
          chip.style.borderColor = "var(--color-amber-warn)";
          chip.style.color = "var(--color-amber-warn)";
        } else {
          chipText.textContent = "🟢 LIVE DATA (ข้อมูลจริงจากระบบ)";
          chip.style.borderColor = "var(--color-emerald-primary)";
          chip.style.color = "var(--color-emerald-primary)";
        }
      }
    }

    // Dashboard Banner & Sensor Cards
    const statusBanner = document.getElementById("statusBanner");
    const statusTitle = document.getElementById("statusTitle");
    const statusDesc = document.getElementById("statusDesc");

    if (statusBanner && statusTitle) {
      if (s.systemStatus === "NORMAL" || s.systemStatus === "ปกติ") {
        statusBanner.className = "status-banner";
        statusTitle.textContent = "🟢 ปกติ (SYSTEM NORMAL)";
        if (statusDesc) statusDesc.textContent = s.statusMessage;
      } else {
        statusBanner.className = "status-banner status-warning";
        statusTitle.textContent = `🟡 ${s.systemStatus}`;
        if (statusDesc) statusDesc.textContent = s.statusMessage;
      }
    }

    // Key Sensor Metric Values
    if (document.getElementById("valTemp")) document.getElementById("valTemp").textContent = s.temperature;
    if (document.getElementById("valPH")) document.getElementById("valPH").textContent = s.ph;
    if (document.getElementById("valWater")) document.getElementById("valWater").textContent = s.waterLevel;
    if (document.getElementById("valLightPct")) document.getElementById("valLightPct").textContent = s.lightPct;

    if (document.getElementById("cardPumpStateText")) document.getElementById("cardPumpStateText").textContent = s.pump ? "ON" : "OFF";
    if (document.getElementById("cardPumpModeText")) document.getElementById("cardPumpModeText").textContent = `(โหมด ${s.mode})`;

    // Control Page elements refresh
    if (document.getElementById("ctrlModeVal")) document.getElementById("ctrlModeVal").textContent = s.mode;
    if (document.getElementById("ctrlPumpVal")) document.getElementById("ctrlPumpVal").textContent = s.pump ? "ON" : "OFF";
    if (document.getElementById("ctrlWaterVal")) document.getElementById("ctrlWaterVal").textContent = `${s.waterLevel} %`;
    if (document.getElementById("ctrlSafetyVal")) {
      document.getElementById("ctrlSafetyVal").textContent = s.waterLevel < 20 ? "LOCKED (< 20%)" : "READY";
      document.getElementById("ctrlSafetyVal").className = s.waterLevel < 20 ? "kpi-value text-rose" : "kpi-value text-emerald";
    }
    if (document.getElementById("ctrlModeChip")) document.getElementById("ctrlModeChip").textContent = `MODE: ${s.mode}`;
    if (document.getElementById("ctrlPumpChip")) document.getElementById("ctrlPumpChip").textContent = `PUMP: ${s.pump ? "ON" : "OFF"}`;
    if (document.getElementById("ctrlHumanStatus")) {
      document.getElementById("ctrlHumanStatus").textContent = s.statusMessage || s.recommendation || `ระบบกำลังทำงานในโหมด ${s.mode}`;
    }

    // Safety Lock Banner
    const safetyBanner = document.getElementById("safetyLockBanner");
    if (safetyBanner) safetyBanner.style.display = s.waterLevel < 20 ? "block" : "none";

    this.updateDashboardChart(s);
  }

  // --------------------------------------------------------------------------
  // 5. CHART ENGINES
  // --------------------------------------------------------------------------
  initDashboardChart() {
    const ctx = document.getElementById("dashboardChart");
    if (!ctx) return;
    if (this.dashboardChart) this.dashboardChart.destroy();

    this.dashboardChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["04:00", "04:10", "04:20", "04:30", "04:40", "ปัจจุบัน"],
        datasets: [
          { label: "อุณหภูมิน้ำ (°C)", data: [28.2, 28.3, 28.5, 28.4, 28.4, window.demoSensorData.temperature], borderColor: "#ef4444", tension: 0.3 },
          { label: "ค่า pH", data: [6.1, 6.2, 6.2, 6.3, 6.2, window.demoSensorData.ph], borderColor: "#06b6d4", tension: 0.3 }
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
        labels: ["04:00", "04:10", "04:20", "04:30", "04:40", "05:00"],
        datasets: [
          { label: "อุณหภูมิน้ำ (°C)", data: [28.2, 28.3, 28.5, 28.4, 28.4, 28.4], borderColor: "#ef4444", tension: 0.3 },
          { label: "ค่า pH", data: [6.1, 6.2, 6.2, 6.3, 6.2, 6.2], borderColor: "#06b6d4", tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#94a3b8" } } }
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
        labels: ["สัปดาห์ 35 (จริง)", "สัปดาห์ 36 (จริง)", "สัปดาห์ 37 (จริง)", "สัปดาห์ 38 (ปัจจุบัน)", "สัปดาห์ 39 (คาดการณ์)"],
        datasets: [
          { label: "ผลผลิตจริง (Historical Yield kg)", data: [1.2, 1.4, 1.56, 1.85, null], borderColor: "#10b981", tension: 0.3 },
          { label: "คาดการณ์สถิติ (Forecast Line kg)", data: [null, null, null, 1.85, 2.2], borderColor: "#f59e0b", borderDash: [5, 5], tension: 0.3 }
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
          label: "อุณหภูมิน้ำ (°C) vs Growth Rate (g/วัน)",
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

  initAlertsPage() {
    document.querySelectorAll("[data-alert-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-alert-filter]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  initAboutPage() {}

  getFallbackPageTemplate(pageName) {
    const s = window.demoSensorData;
    return `<div class="panel-card"><h3>📌 หน้า ${pageName}</h3><p>ระบบพร้อมแสดงข้อมูลจริง</p></div>`;
  }
}

// Auto Init App
document.addEventListener("DOMContentLoaded", () => {
  window.app = new WolffiaApp();
});
