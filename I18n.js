/* ==========================================================================
   i18n.js
   Lightweight EN/AR language switcher. No frameworks — walks elements
   tagged with data-i18n / data-i18n-placeholder and swaps text based on
   the dictionary below. Persists choice in localStorage like the theme
   toggle, and flips <html dir> for RTL layout.

   Usage in HTML:
     <h1 data-i18n="welcome">Welcome</h1>
     <input data-i18n-placeholder="search_ph">
     <button class="lang-toggle" id="langToggle">EN / AR</button>

   Load order on every page:
     <script src="supabaseClient.js"></script>
     <script src="i18n.js"></script>
   ========================================================================== */

window.I18N = {
  en: {
    brand: "Feras Company Medical Portal",
    logout: "Log Out",
    back_dashboard: "← Back to dashboard",
    verifying_session: "Verifying your session…",

    // auth.html
    welcome: "Welcome",
    signin_sub: "Sign in to manage patient records",
    tab_login: "Log In",
    tab_signup: "Sign Up",
    label_email: "Email",
    label_password: "Password",
    btn_login: "Log In",
    label_first_name: "First name",
    label_last_name: "Last name",
    btn_signup: "Create Account",
    signup_fineprint: "New accounts are created with standard patient access.",

    // index.html
    greeting_default: "Welcome back",
    sub_admin: "System overview and patient records.",
    sub_patient: "Manage your health record submissions.",
    badge_admin: "Administrator",
    badge_patient: "Patient",
    stat_total: "Total patients",
    stat_week: "New this week",
    stat_allergy: "With allergies on file",
    stat_insured: "With insurance on file",
    panel_db_access: "Database access",
    action_new_intake: "New intake form",
    action_new_intake_desc: "Register a patient manually",
    action_supabase: "Supabase table editor",
    action_supabase_desc: "Direct database access",
    action_export: "Export records",
    action_export_desc: "Download patients as CSV",
    panel_recent_patients: "Recent patients",
    th_name: "Name",
    th_dob: "DOB",
    th_blood: "Blood type",
    th_insurance: "Insurance",
    th_registered: "Registered",
    panel_appointments: "Appointments",
    th_patient: "Patient",
    th_department: "Department",
    th_date: "Date",
    th_time: "Time",
    th_status: "Status",
    action_book_appt: "Book an appointment",
    action_book_appt_desc: "Schedule a visit with a department",
    action_start_registration: "Start registration",
    action_start_registration_desc: "Submit your health record intake form",
    action_my_submissions: "My submissions",
    action_my_appt: "My appointments",
    action_help: "Need help?",
    action_help_desc: "Use the chat assistant in the bottom corner",

    // form.html
    intake_title: "Patient Intake Form",
    intake_sub: "All fields marked required must be completed before submitting.",
    section_personal: "Personal Information",
    section_medical: "Medical History",
    section_insurance: "Insurance",
    label_dob: "Date of birth",
    label_gender: "Gender",
    label_phone: "Phone",
    label_address: "Address",
    label_blood_type: "Blood type",
    label_weight: "Weight (kg)",
    label_allergies: "Known allergies",
    label_medications: "Current medications",
    label_conditions: "Existing conditions",
    label_provider: "Provider",
    label_policy: "Policy number",
    btn_cancel: "Cancel",
    btn_submit_intake: "Submit Intake Form",
    intake_success_title: "Form submitted",
    intake_success_desc: "The patient record has been saved.",
    btn_submit_another: "Submit another",

    // appointment.html
    appt_title: "Book an Appointment",
    appt_sub: "Pick a department and a time that works for you.",
    label_full_name: "Full name",
    label_department: "Department",
    label_date: "Date",
    label_time: "Time",
    label_reason: "Reason for visit",
    btn_book_appt: "Book Appointment",
    appt_success_title: "Appointment requested",
    appt_success_desc: "We've logged your request as pending confirmation.",
    btn_book_another: "Book another",
  },
  ar: {
    brand: "بوابة شركة فراس الطبية",
    logout: "تسجيل الخروج",
    back_dashboard: "← العودة إلى لوحة التحكم",
    verifying_session: "جارٍ التحقق من الجلسة…",

    welcome: "أهلاً بك",
    signin_sub: "سجّل الدخول لإدارة سجلات المرضى",
    tab_login: "تسجيل الدخول",
    tab_signup: "إنشاء حساب",
    label_email: "البريد الإلكتروني",
    label_password: "كلمة المرور",
    btn_login: "تسجيل الدخول",
    label_first_name: "الاسم الأول",
    label_last_name: "اسم العائلة",
    btn_signup: "إنشاء الحساب",
    signup_fineprint: "يتم إنشاء الحسابات الجديدة بصلاحيات مريض قياسية.",

    greeting_default: "أهلاً بعودتك",
    sub_admin: "نظرة عامة على النظام وسجلات المرضى.",
    sub_patient: "إدارة طلباتك من السجلات الصحية.",
    badge_admin: "مسؤول النظام",
    badge_patient: "مريض",
    stat_total: "إجمالي المرضى",
    stat_week: "جديد هذا الأسبوع",
    stat_allergy: "لديهم حساسية مسجّلة",
    stat_insured: "لديهم تأمين مسجّل",
    panel_db_access: "الوصول إلى قاعدة البيانات",
    action_new_intake: "نموذج تسجيل جديد",
    action_new_intake_desc: "تسجيل مريض يدويًا",
    action_supabase: "محرر جداول Supabase",
    action_supabase_desc: "وصول مباشر لقاعدة البيانات",
    action_export: "تصدير السجلات",
    action_export_desc: "تنزيل بيانات المرضى بصيغة CSV",
    panel_recent_patients: "أحدث المرضى",
    th_name: "الاسم",
    th_dob: "تاريخ الميلاد",
    th_blood: "فصيلة الدم",
    th_insurance: "التأمين",
    th_registered: "تاريخ التسجيل",
    panel_appointments: "المواعيد",
    th_patient: "المريض",
    th_department: "القسم",
    th_date: "التاريخ",
    th_time: "الوقت",
    th_status: "الحالة",
    action_book_appt: "حجز موعد",
    action_book_appt_desc: "جدولة زيارة مع أحد الأقسام",
    action_start_registration: "بدء التسجيل",
    action_start_registration_desc: "أرسل نموذج تسجيل سجلك الصحي",
    action_my_submissions: "طلباتي",
    action_my_appt: "مواعيدي",
    action_help: "بحاجة إلى مساعدة؟",
    action_help_desc: "استخدم مساعد الدردشة في الزاوية السفلية",

    intake_title: "نموذج تسجيل بيانات المريض",
    intake_sub: "يجب تعبئة جميع الحقول المطلوبة قبل الإرسال.",
    section_personal: "المعلومات الشخصية",
    section_medical: "التاريخ الطبي",
    section_insurance: "التأمين",
    label_dob: "تاريخ الميلاد",
    label_gender: "الجنس",
    label_phone: "رقم الهاتف",
    label_address: "العنوان",
    label_blood_type: "فصيلة الدم",
    label_weight: "الوزن (كجم)",
    label_allergies: "الحساسية المعروفة",
    label_medications: "الأدوية الحالية",
    label_conditions: "الحالات المرضية القائمة",
    label_provider: "شركة التأمين",
    label_policy: "رقم الوثيقة",
    btn_cancel: "إلغاء",
    btn_submit_intake: "إرسال نموذج التسجيل",
    intake_success_title: "تم إرسال النموذج",
    intake_success_desc: "تم حفظ سجل المريض بنجاح.",
    btn_submit_another: "إرسال نموذج آخر",

    appt_title: "حجز موعد",
    appt_sub: "اختر القسم والوقت المناسب لك.",
    label_full_name: "الاسم الكامل",
    label_department: "القسم",
    label_date: "التاريخ",
    label_time: "الوقت",
    label_reason: "سبب الزيارة",
    btn_book_appt: "احجز الموعد",
    appt_success_title: "تم تقديم طلب الموعد",
    appt_success_desc: "تم تسجيل طلبك وهو بانتظار التأكيد.",
    btn_book_another: "حجز موعد آخر",
  },
};

(function () {
  function currentLang() {
    return localStorage.getItem("lang") || "en";
  }

  function applyLang(lang) {
    const dict = window.I18N[lang] || window.I18N.en;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) el.setAttribute("placeholder", dict[key]);
    });

    const toggle = document.getElementById("langToggle");
    if (toggle) toggle.textContent = lang === "ar" ? "EN" : "AR";

    localStorage.setItem("lang", lang);
  }

  window.applyLang = applyLang;
  window.toggleLang = function toggleLang() {
    applyLang(currentLang() === "ar" ? "en" : "ar");
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyLang(currentLang());
    const toggle = document.getElementById("langToggle");
    if (toggle) toggle.addEventListener("click", window.toggleLang);
  });
})();
