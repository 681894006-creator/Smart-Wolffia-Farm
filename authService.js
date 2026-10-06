/**
 * SMART WOLFFIA FARM V3 — AUTHENTICATION SERVICE & SUPABASE AUTH PROVIDER
 * Centralized Session Manager, Role Engine & Supabase Auth Provider
 */

const AuthService = {
  supabaseClient: null,
  currentUser: null,
  session: null,
  isInitialized: false,

  init() {
    if (this.isInitialized) return this.currentUser;

    // Read stored fallback session if available
    const storedUser = sessionStorage.getItem("wolffia_user");
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        this.currentUser = null;
      }
    }

    // Initialize Supabase Auth Client using Env or App Config
    this.initSupabaseClient();

    this.isInitialized = true;
    return this.currentUser;
  },

  initSupabaseClient() {
    let url = "";
    let key = "";

    // 1. Try Environment Variables (Vite / Window Env)
    if (typeof import.meta !== "undefined" && import.meta.env) {
      url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || "";
      key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || "";
    }

    // 2. Fallback to APP_CONFIG
    if ((!url || url.includes("xyzexample")) && typeof APP_CONFIG !== "undefined" && APP_CONFIG.supabase) {
      url = APP_CONFIG.supabase.url;
      key = APP_CONFIG.supabase.anonKey;
    }

    if (window.supabase && url && key && !url.includes("xyzexample")) {
      try {
        this.supabaseClient = window.supabase.createClient(url, key);
        console.log("[AuthService] Supabase Auth Client initialized successfully.");
        
        // Listen to Auth State Changes
        this.supabaseClient.auth.onAuthStateChange(async (event, session) => {
          console.log(`[AuthService] Auth Event: ${event}`);
          this.session = session;
          if (session && session.user) {
            await this.syncProfile(session.user);
          }
        });
      } catch (err) {
        console.warn("[AuthService] Failed to initialize Supabase client:", err.message);
      }
    }
  },

  async getSession() {
    if (!this.supabaseClient) this.initSupabaseClient();

    if (this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient.auth.getSession();
        if (!error && data && data.session) {
          this.session = data.session;
          await this.syncProfile(data.session.user);
          return this.session;
        }
      } catch (e) {
        console.warn("[AuthService] getSession failed:", e.message);
      }
    }
    return null;
  },

  async signIn(email, password) {
    if (!email || !password) {
      return { success: false, message: "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน" };
    }

    if (!this.supabaseClient) this.initSupabaseClient();

    // 1. Local Shortcut Credentials for Quick Offline Testing
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.includes("admin") && password === "admin123") {
      this.currentUser = {
        id: "local-admin-id",
        email: email,
        role: "admin",
        display_name: "Admin User",
        status: "เข้าสู่ระบบสำเร็จ (Admin Access)"
      };
      sessionStorage.setItem("wolffia_user", JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    } else if (cleanEmail.includes("viewer") && password === "viewer123") {
      this.currentUser = {
        id: "local-viewer-id",
        email: email,
        role: "viewer",
        display_name: "Viewer User",
        status: "เข้าสู่ระบบสำเร็จ (Viewer Access)"
      };
      sessionStorage.setItem("wolffia_user", JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }

    // 2. Real Supabase Auth Integration
    if (!this.supabaseClient) {
      return { success: false, message: "ไม่พบการตั้งค่า Supabase กรุณาตรวจสอบ URL และ Anon Key ใน config.js" };
    }

    try {
      const { data, error } = await this.supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        console.warn("[AuthService] Supabase Auth Error:", error.message);
        if (error.message.includes("Invalid login credentials") || error.status === 400) {
          return { success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง" };
        }
        return { success: false, message: `ไม่สามารถเข้าสู่ระบบได้: ${error.message}` };
      }

      if (data && data.user) {
        this.session = data.session;
        const profile = await this.syncProfile(data.user);
        return { success: true, user: this.currentUser, profile };
      }
    } catch (err) {
      console.error("[AuthService] Login Exception:", err);
      return { success: false, message: "ไม่สามารถเชื่อมต่อระบบเข้าสู่ระบบได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต" };
    }

    return { success: false, message: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์" };
  },

  async syncProfile(authUser) {
    let role = "viewer";
    let displayName = authUser.email;
    let statusMsg = "เข้าสู่ระบบสำเร็จ";

    if (this.supabaseClient) {
      try {
        // Query Profiles Table by auth.uid()
        const { data: profile, error } = await this.supabaseClient
          .from("profiles")
          .select("role, display_name")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profile) {
          role = profile.role || "viewer";
          displayName = profile.display_name || authUser.email;
        } else {
          statusMsg = "เข้าสู่ระบบสำเร็จ แต่ยังไม่พบสิทธิ์การใช้งาน (กำหนดสิทธิ์เป็น VIEWER ชั่วคราว)";
          console.warn(`[AuthService] Profile not found for UID: ${authUser.id}. Defaulting role to viewer.`);
        }
      } catch (err) {
        console.warn("[AuthService] Failed to query profiles table:", err.message);
      }
    }

    this.currentUser = {
      id: authUser.id,
      email: authUser.email,
      role: role,
      display_name: displayName,
      status: statusMsg
    };

    sessionStorage.setItem("wolffia_user", JSON.stringify(this.currentUser));
    return this.currentUser;
  },

  async signOut() {
    if (this.supabaseClient) {
      try {
        await this.supabaseClient.auth.signOut();
      } catch (e) {}
    }
    this.currentUser = null;
    this.session = null;
    sessionStorage.removeItem("wolffia_user");
    window.location.href = "login.html";
  },

  getCurrentUser() {
    if (!this.currentUser) this.init();
    return this.currentUser || { email: "public@wolffia.farm", role: "public", display_name: "Public Viewer" };
  },

  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.role : "public";
  },

  isAdmin() {
    return this.getUserRole() === "admin";
  },

  isViewer() {
    return this.getUserRole() === "viewer";
  }
};

window.AuthService = AuthService;
