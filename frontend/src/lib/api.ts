import apiClient from './apiClient';

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  refreshToken: (accessToken: string, refreshToken: string) =>
    apiClient.post('/auth/refresh-token', { accessToken, refreshToken }),
  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { oldPassword, newPassword }),
  register: (data: unknown) => apiClient.post('/auth/register', data),
};

// Dashboard
export const dashboardApi = {
  getSummary: () => apiClient.get('/dashboard/summary'),
  getKpiChart: (period = 'Monthly') => apiClient.get(`/dashboard/kpi-chart?period=${period}`),
  getLeadFunnel: () => apiClient.get('/dashboard/lead-funnel'),
  getLeaderboard: () => apiClient.get('/dashboard/leaderboard'),
  getRevenueForecast: () => apiClient.get('/dashboard/revenue-forecast'),
  getDailyActivities: () => apiClient.get('/dashboard/daily-activities'),
};

// Employees
export const employeeApi = {
  getAll: (departmentId?: string) =>
    apiClient.get(`/employee${departmentId ? `?departmentId=${departmentId}` : ''}`),
  getMe: () => apiClient.get('/employee/me'),
  getById: (id: string) => apiClient.get(`/employee/${id}`),
  update: (id: string, data: unknown) => apiClient.put(`/employee/${id}`, data),
  delete: (id: string) => apiClient.delete(`/employee/${id}`),
};

// Departments
export const departmentApi = {
  getAll: () => apiClient.get('/department'),
  getById: (id: string) => apiClient.get(`/department/${id}`),
  create: (data: unknown) => apiClient.post('/department', data),
  update: (id: string, data: unknown) => apiClient.put(`/department/${id}`, data),
  delete: (id: string) => apiClient.delete(`/department/${id}`),
};

// Positions
export const positionApi = {
  getAll: () => apiClient.get('/position'),
  create: (data: unknown) => apiClient.post('/position', data),
  update: (id: string, data: unknown) => apiClient.put(`/position/${id}`, data),
  delete: (id: string) => apiClient.delete(`/position/${id}`),
};

// Work Plans
export const workPlanApi = {
  getPlans: (week: number, year: number) =>
    apiClient.get(`/workplan?week=${week}&year=${year}`),
  getMyPlan: (week: number, year: number) =>
    apiClient.get(`/workplan/me?week=${week}&year=${year}`),
  savePlan: (data: unknown) => apiClient.post('/workplan', data),
  updateItem: (itemId: string, data: unknown) =>
    apiClient.put(`/workplan/item/${itemId}`, data),
  deleteItem: (itemId: string) => apiClient.delete(`/workplan/item/${itemId}`),
  addFeedback: (id: string, feedback: string) => apiClient.put(`/workplan/${id}/feedback`, { feedback }),
};

// Reports
export const reportApi = {
  getDailyReports: (params?: { date?: string; employeeId?: string }) =>
    apiClient.get('/report/daily', { params }),
  createDailyReport: (data: FormData) =>
    apiClient.post('/report/daily', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getWeeklyReports: (params?: { week?: number; year?: number; employeeId?: string }) =>
    apiClient.get('/report/weekly', { params }),
  createWeeklyReport: (data: FormData) =>
    apiClient.post('/report/weekly', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addDailyFeedback: (id: string, feedback: string) =>
    apiClient.put(`/report/daily/${id}/feedback`, { feedback }),
  addWeeklyFeedback: (id: string, feedback: string) =>
    apiClient.put(`/report/weekly/${id}/feedback`, { feedback }),
};

// CRM
export const crmApi = {
  getLeads: (params?: { status?: string; ownerId?: string }) =>
    apiClient.get('/crm/lead', { params }),
  getLeadById: (id: string) => apiClient.get(`/crm/lead/${id}`),
  createLead: (data: unknown) => apiClient.post('/crm/lead', data),
  updateLead: (id: string, data: unknown) => apiClient.put(`/crm/lead/${id}`, data),
  deleteLead: (id: string) => apiClient.delete(`/crm/lead/${id}`),
  addActivity: (leadId: string, data: unknown) =>
    apiClient.post(`/crm/lead/${leadId}/activity`, data),
  importLeads: (data: unknown) => apiClient.post('/crm/import', data),
  deleteAllLeads: () => apiClient.delete('/crm/delete-all'),
};

// KPI
export const kpiApi = {
  getKpis: (period?: string) => apiClient.get(`/kpi${period ? `?period=${period}` : ''}`),
  createKpi: (data: unknown) => apiClient.post('/kpi', data),
  updateValue: (id: string, currentValue: number) =>
    apiClient.put(`/kpi/${id}/value`, { currentValue }),
  deleteKpi: (id: string) => apiClient.delete(`/kpi/${id}`),
};

// Attendance
export const attendanceApi = {
  getAttendanceLogs: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/attendance', { params }),
  getTodayStatus: () => apiClient.get('/attendance/today'),
  checkIn: () => apiClient.post('/attendance/check-in'),
  checkOut: () => apiClient.post('/attendance/check-out'),
};

// Leave Requests
export const leaveApi = {
  getRequests: () => apiClient.get('/leaverequest'),
  submitRequest: (data: unknown) => apiClient.post('/leaverequest', data),
  approveRequest: (id: string, data: { status: string; approvalNotes?: string }) =>
    apiClient.put(`/leaverequest/${id}/approve`, data),
};

// Notifications
export const notificationApi = {
  getNotifications: () => apiClient.get('/notification'),
  markAsRead: (id: string) => apiClient.put(`/notification/${id}/read`),
  createNotification: (data: unknown) => apiClient.post('/notification', data),
};

// Audit Logs
export const auditLogApi = {
  getLogs: (params?: { tableName?: string; action?: string }) =>
    apiClient.get('/auditlog', { params }),
};

// AI Assistant
export const aiApi = {
  getDailyBrief: () => apiClient.get('/ai/assistant/daily-brief'),
};

// Class Management (Quản lý Đào tạo)
export const classApi = {
  getAll: () => apiClient.get('/class'),
  getById: (id: string) => apiClient.get(`/class/${id}`),
  getByInstructor: (instructorId: string) => apiClient.get(`/class/instructor/${instructorId}`),
  create: (data: unknown) => apiClient.post('/class', data),
  updateClass: (id: string, data: unknown) => apiClient.put(`/class/${id}`, data),
  deleteClass: (id: string) => apiClient.delete(`/class/${id}`),
  assignInstructor: (id: string, instructorId: string) =>
    apiClient.put(`/class/${id}/assign-instructor`, { instructorId }),
  enrollStudent: (classId: string, data: unknown) => apiClient.post(`/class/${classId}/enroll`, data),
  updateEnrollment: (enrollmentId: string, data: unknown) => apiClient.put(`/class/students/${enrollmentId}`, data),
  deleteEnrollment: (enrollmentId: string) => apiClient.delete(`/class/students/${enrollmentId}`),
  getTuitionAlerts: () => apiClient.get('/class/tuition-alerts'),
  getStudents: () => apiClient.get('/class/students'),
  createStudent: (data: unknown) => apiClient.post('/class/students', data),
  updateStudent: (studentId: string, data: unknown) => apiClient.put(`/class/students/manage/${studentId}`, data),
  deleteStudent: (studentId: string) => apiClient.delete(`/class/students/manage/${studentId}`),
  bulkDeleteStudents: (ids: string[]) => apiClient.post('/class/students/manage/bulk', { ids }),
  bulkDeleteEnrollments: (ids: string[]) => apiClient.post('/class/enrollments/bulk', { ids }),
  
  // Sessions & Attendance
  getSessions: (classId: string) => apiClient.get('/class/sessions', { params: { classId } }),
  createSession: (classId: string, data: unknown) => apiClient.post('/class/sessions', data, { params: { classId } }),
  createSessionBulk: (classId: string, sessions: any[]) => apiClient.post('/class/sessions/bulk', { classId, sessions }),
  deleteSession: (sessionId: string) => apiClient.delete('/class/sessions', { params: { sessionId } }),
  deleteAllSessions: (classId: string) => apiClient.delete('/class/sessions/bulk', { params: { classId } }),
  saveAttendance: (sessionId: string, data: unknown) => apiClient.put('/class/attendance/bulk', data, { params: { sessionId } }),
  
  // Tests & Scores
  getTests: (classId: string) => apiClient.get('/class/tests', { params: { classId } }),
  createTest: (classId: string, data: { date: string; title: string }) => apiClient.post('/class/tests', data, { params: { classId } }),
  deleteTest: (testId: string) => apiClient.delete('/class/tests', { params: { testId } }),
  saveTestScores: (testId: string, scores: any[]) => apiClient.post('/class/test-scores', { testId, scores }),
};

export const studentAuthApi = {
  login: (data: unknown) => apiClient.post('/student/login', data),
  checkIn: (sessionId: string) => apiClient.post('/student/check-in', { sessionId }),
};

