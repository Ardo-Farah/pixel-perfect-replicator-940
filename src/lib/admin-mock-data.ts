// Mock data for admin dashboard preview.
// TODO: Replace these fixtures with live Supabase queries once backend wiring begins.
// Types intentionally mirror the future Supabase schema so the swap is mechanical.

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
  last_active_at: string;
};

export type AdminReport = {
  id: string;
  week_number: number;
  reporting_date: string;
  published: boolean;
  uploaded_by: string;
  created_at: string;
};

export type AdminDocument = {
  id: string;
  name: string;
  size_bytes: number;
  file_type: "pptx" | "pdf" | "xlsx";
  week_number: number;
  uploaded_at: string;
  uploader_email: string;
};

export type AuditEntry = {
  id: string;
  actor_email: string;
  action:
    | "publish_report"
    | "unpublish_report"
    | "delete_report"
    | "upload_document"
    | "delete_document"
    | "grant_admin"
    | "revoke_admin"
    | "delete_user";
  target: string;
  created_at: string;
};

const now = Date.now();
const days = (n: number) => new Date(now - n * 86_400_000).toISOString();

export const mockUsers: AdminUser[] = [
  { id: "u_001", full_name: "Ardo Umar",          email: "ardoumar6@gmail.com",         role: "admin", created_at: days(180), last_active_at: days(0) },
  { id: "u_002", full_name: "Dr. Wanjiku Mwangi", email: "w.mwangi@health.go.ke",       role: "user",  created_at: days(120), last_active_at: days(1) },
  { id: "u_003", full_name: "James Otieno",       email: "j.otieno@who.int",            role: "user",  created_at: days(95),  last_active_at: days(2) },
  { id: "u_004", full_name: "Grace Achieng",      email: "g.achieng@redcross.or.ke",    role: "user",  created_at: days(78),  last_active_at: days(0) },
  { id: "u_005", full_name: "Dr. Samuel Kiprop",  email: "s.kiprop@health.go.ke",       role: "admin", created_at: days(60),  last_active_at: days(3) },
  { id: "u_006", full_name: "Mary Nasimiyu",      email: "m.nasimiyu@unicef.org",       role: "user",  created_at: days(45),  last_active_at: days(5) },
  { id: "u_007", full_name: "Peter Kamau",        email: "p.kamau@msf.org",             role: "user",  created_at: days(30),  last_active_at: days(1) },
  { id: "u_008", full_name: "Faith Wambui",       email: "f.wambui@health.go.ke",       role: "user",  created_at: days(20),  last_active_at: days(7) },
  { id: "u_009", full_name: "Brian Odhiambo",     email: "b.odhiambo@who.int",          role: "user",  created_at: days(14),  last_active_at: days(0) },
  { id: "u_010", full_name: "Lucy Mutindi",       email: "l.mutindi@cdc.gov",           role: "user",  created_at: days(7),   last_active_at: days(2) },
];

export const mockReports: AdminReport[] = Array.from({ length: 12 }).map((_, i) => {
  const week = 17 - i;
  return {
    id: `r_${String(week).padStart(2, "0")}`,
    week_number: week,
    reporting_date: days(i * 7 + 2).slice(0, 10),
    published: i < 9,
    uploaded_by: i % 2 === 0 ? "ardoumar6@gmail.com" : "s.kiprop@health.go.ke",
    created_at: days(i * 7),
  };
});

export const mockDocuments: AdminDocument[] = [
  { id: "d_01", name: "WHO_Kenya_Emergency_Bulletin_W17_2026.pptx", size_bytes: 4_820_000, file_type: "pptx", week_number: 17, uploaded_at: days(1),  uploader_email: "ardoumar6@gmail.com" },
  { id: "d_02", name: "Mpox_Surveillance_W17.pdf",                   size_bytes: 1_240_000, file_type: "pdf",  week_number: 17, uploaded_at: days(1),  uploader_email: "ardoumar6@gmail.com" },
  { id: "d_03", name: "Cholera_Linelist_W17.xlsx",                   size_bytes: 312_000,   file_type: "xlsx", week_number: 17, uploaded_at: days(2),  uploader_email: "s.kiprop@health.go.ke" },
  { id: "d_04", name: "WHO_Kenya_Emergency_Bulletin_W16_2026.pptx", size_bytes: 4_650_000, file_type: "pptx", week_number: 16, uploaded_at: days(8),  uploader_email: "ardoumar6@gmail.com" },
  { id: "d_05", name: "Measles_Outbreak_Garissa_W16.pdf",            size_bytes: 980_000,   file_type: "pdf",  week_number: 16, uploaded_at: days(9),  uploader_email: "s.kiprop@health.go.ke" },
  { id: "d_06", name: "Floods_SitRep_W16.pdf",                       size_bytes: 1_780_000, file_type: "pdf",  week_number: 16, uploaded_at: days(9),  uploader_email: "ardoumar6@gmail.com" },
  { id: "d_07", name: "WHO_Kenya_Emergency_Bulletin_W15_2026.pptx", size_bytes: 4_410_000, file_type: "pptx", week_number: 15, uploaded_at: days(15), uploader_email: "ardoumar6@gmail.com" },
  { id: "d_08", name: "IDSR_Completeness_W15.xlsx",                  size_bytes: 244_000,   file_type: "xlsx", week_number: 15, uploaded_at: days(16), uploader_email: "s.kiprop@health.go.ke" },
  { id: "d_09", name: "Nutrition_IPC_Phase3_W14.pdf",                size_bytes: 2_140_000, file_type: "pdf",  week_number: 14, uploaded_at: days(22), uploader_email: "ardoumar6@gmail.com" },
  { id: "d_10", name: "WHO_Kenya_Emergency_Bulletin_W14_2026.pptx", size_bytes: 4_220_000, file_type: "pptx", week_number: 14, uploaded_at: days(22), uploader_email: "ardoumar6@gmail.com" },
];

export const mockAudit: AuditEntry[] = [
  { id: "a_01", actor_email: "ardoumar6@gmail.com",   action: "publish_report",   target: "Week 17 Report",                        created_at: days(0) },
  { id: "a_02", actor_email: "ardoumar6@gmail.com",   action: "upload_document",  target: "Mpox_Surveillance_W17.pdf",             created_at: days(1) },
  { id: "a_03", actor_email: "s.kiprop@health.go.ke", action: "grant_admin",      target: "ardoumar6@gmail.com",                   created_at: days(2) },
  { id: "a_04", actor_email: "ardoumar6@gmail.com",   action: "delete_document",  target: "Old_Draft_W16.pdf",                     created_at: days(3) },
  { id: "a_05", actor_email: "ardoumar6@gmail.com",   action: "unpublish_report", target: "Week 16 Report",                        created_at: days(4) },
  { id: "a_06", actor_email: "s.kiprop@health.go.ke", action: "upload_document",  target: "WHO_Kenya_Emergency_Bulletin_W16.pptx", created_at: days(8) },
  { id: "a_07", actor_email: "ardoumar6@gmail.com",   action: "publish_report",   target: "Week 16 Report",                        created_at: days(9) },
  { id: "a_08", actor_email: "ardoumar6@gmail.com",   action: "delete_user",      target: "test_account@example.com",              created_at: days(11) },
  { id: "a_09", actor_email: "s.kiprop@health.go.ke", action: "publish_report",   target: "Week 15 Report",                        created_at: days(15) },
  { id: "a_10", actor_email: "ardoumar6@gmail.com",   action: "upload_document",  target: "IDSR_Completeness_W15.xlsx",            created_at: days(16) },
  { id: "a_11", actor_email: "ardoumar6@gmail.com",   action: "revoke_admin",     target: "former.admin@health.go.ke",             created_at: days(19) },
  { id: "a_12", actor_email: "s.kiprop@health.go.ke", action: "delete_report",    target: "Week 13 (duplicate)",                   created_at: days(25) },
];

// Uploads per week, last 8 weeks (for the overview bar chart).
export const mockUploadsPerWeek = [
  { week: "W10", count: 2 },
  { week: "W11", count: 4 },
  { week: "W12", count: 3 },
  { week: "W13", count: 5 },
  { week: "W14", count: 4 },
  { week: "W15", count: 6 },
  { week: "W16", count: 5 },
  { week: "W17", count: 7 },
];

// Actions per day, last 14 days (for the logs bar chart).
export const mockActionsPerDay = Array.from({ length: 14 }).map((_, i) => ({
  day: new Date(now - (13 - i) * 86_400_000).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  count: Math.max(1, Math.round(3 + Math.sin(i / 2) * 3 + (i % 4))),
}));

// Action breakdown for the pie chart.
export const mockActionBreakdown = [
  { name: "Upload",       value: 18, color: "#009ADE" },
  { name: "Publish",      value: 12, color: "#0d7a5f" },
  { name: "Delete",       value: 6,  color: "#c44569" },
  { name: "Role change",  value: 4,  color: "#c9a84c" },
];

export const mockKpis = {
  total_users: mockUsers.length,
  published_reports: mockReports.filter((r) => r.published).length,
  documents_stored: mockDocuments.length,
  actions_last_7d: mockAudit.filter((a) => Date.now() - new Date(a.created_at).getTime() < 7 * 86_400_000).length,
};
