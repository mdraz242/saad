const API_BASE =
  ((import.meta as any).env?.VITE_API_URL as string | undefined) ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001/api'
    : '/api');

// Staff token management
export const staffAuthStorage = {
  getToken: () => localStorage.getItem('bp_staff_token'),
  setToken: (token: string) => localStorage.setItem('bp_staff_token', token),
  clearToken: () => localStorage.removeItem('bp_staff_token'),
};

// Customer session token
let customerSessionToken: string | null = null;
let currentCaseNumber: string | null = null;

export const customerSession = {
  getToken: () => customerSessionToken,
  getCaseNumber: () => currentCaseNumber,
  setSession: (token: string, caseNumber: string) => {
    customerSessionToken = token;
    currentCaseNumber = caseNumber;
    sessionStorage.setItem('bp_case_token', token);
    sessionStorage.setItem('bp_case_num', caseNumber);
  },
  loadFromSession: () => {
    customerSessionToken = sessionStorage.getItem('bp_case_token');
    currentCaseNumber = sessionStorage.getItem('bp_case_num');
    return { token: customerSessionToken, caseNumber: currentCaseNumber };
  },
  clearSession: () => {
    customerSessionToken = null;
    currentCaseNumber = null;
    sessionStorage.removeItem('bp_case_token');
    sessionStorage.removeItem('bp_case_num');
  },
};

customerSession.loadFromSession();

async function request(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Staff Token if available
  const staffToken = staffAuthStorage.getToken();
  if (staffToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${staffToken}`);
  }

  // Attach Customer Case Session Token if available
  const caseToken = customerSession.getToken();
  if (caseToken && !headers.has('x-case-session')) {
    headers.set('x-case-session', caseToken);
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // 1. Staff Authentication
  staffLogin: (body: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  staffMe: () => request('/auth/me'),

  staffLogout: () => request('/auth/logout', { method: 'POST' }),

  // 2. Customer Case Flow
  submitCase: (caseData: any) =>
    request('/cases', { method: 'POST', body: JSON.stringify(caseData) }),

  requestAccess: (caseNumber: string) =>
    request('/cases/request-access', { method: 'POST', body: JSON.stringify({ caseNumber }) }),

  verifyAccess: (caseNumber: string, otpCode: string) =>
    request('/cases/verify-access', { method: 'POST', body: JSON.stringify({ caseNumber, otpCode }) }),

  getCustomerCase: () => request('/cases/customer/current'),

  modifyCustomerCase: (updates: any) =>
    request('/cases/customer/current', { method: 'PATCH', body: JSON.stringify(updates) }),

  cancelCustomerCase: (reason?: string) =>
    request('/cases/customer/cancel', { method: 'POST', body: JSON.stringify({ reason }) }),

  sendCustomerMessage: (message: string) =>
    request('/cases/customer/messages', { method: 'POST', body: JSON.stringify({ message }) }),

  acceptQuotation: (quoteId: string) =>
    request(`/cases/customer/quotations/${quoteId}/accept`, { method: 'POST' }),

  declineQuotation: (quoteId: string, reason?: string) =>
    request(`/cases/customer/quotations/${quoteId}/decline`, { method: 'POST', body: JSON.stringify({ reason }) }),

  downloadCustomerPdfUrl: (quoteId: string) =>
    `${API_BASE}/cases/customer/quotations/${quoteId}/pdf`,

  // 3. Admin & Operational Cases
  getAdminCases: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/cases${qs ? `?${qs}` : ''}`);
  },

  getAdminCase: (id: string) => request(`/admin/cases/${id}`),

  createManualCase: (data: any) =>
    request('/admin/cases', { method: 'POST', body: JSON.stringify(data) }),

  updateAdminCase: (id: string, updates: any) =>
    request(`/admin/cases/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  acceptCaseForProcessing: (id: string) =>
    request(`/admin/cases/${id}/accept-processing`, { method: 'POST' }),

  declineCaseRequest: (id: string, reason: string) =>
    request(`/admin/cases/${id}/decline-request`, { method: 'POST', body: JSON.stringify({ reason }) }),

  requestAdditionalInfo: (id: string, message: string) =>
    request(`/admin/cases/${id}/request-info`, { method: 'POST', body: JSON.stringify({ message }) }),

  closeCase: (id: string, reason?: string) =>
    request(`/admin/cases/${id}/close`, { method: 'POST', body: JSON.stringify({ reason }) }),

  updateCaseStatus: (id: string, status: string, notes?: string) =>
    request(`/admin/cases/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),

  // 4. Staff Messages & Central Messages Inbox
  sendStaffMessage: (caseId: string, message: string) =>
    request(`/cases/${caseId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),

  getMessagesInbox: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/messages/inbox${qs ? `?${qs}` : ''}`);
  },

  getCaseMessages: (caseId: string) =>
    request(`/cases/${caseId}/messages`),

  markMessageRead: (messageId: string) =>
    request(`/messages/${messageId}/read`, { method: 'PATCH' }),

  // 5. Quotation Management
  createQuotation: (caseId: string, data: any) =>
    request(`/admin/cases/${caseId}/quotations`, { method: 'POST', body: JSON.stringify(data) }),

  issueQuotation: (quotationId: string) =>
    request(`/admin/quotations/${quotationId}/issue`, { method: 'POST' }),

  downloadAdminPdfUrl: (quotationId: string) =>
    `${API_BASE}/admin/quotations/${quotationId}/pdf`,

  // 6. Projects Management
  getProjects: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/projects${qs ? `?${qs}` : ''}`);
  },

  getProject: (id: string) => request(`/projects/${id}`),

  createProject: (data: any) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),

  convertCaseToProject: (caseId: string) =>
    request(`/projects/convert-case/${caseId}`, { method: 'POST' }),

  updateProject: (id: string, data: any) =>
    request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  addProjectMaterial: (projectId: string, materialData: any) =>
    request(`/projects/${projectId}/materials`, { method: 'POST', body: JSON.stringify(materialData) }),

  deleteProjectMaterial: (projectId: string, materialId: string) =>
    request(`/projects/${projectId}/materials/${materialId}`, { method: 'DELETE' }),

  // 7. Customers Management
  getCustomers: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/customers${qs ? `?${qs}` : ''}`);
  },

  getCustomer: (id: string) => request(`/customers/${id}`),

  createCustomer: (data: any) =>
    request('/customers', { method: 'POST', body: JSON.stringify(data) }),

  updateCustomer: (id: string, data: any) =>
    request(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // 8. Products & Materials
  getPublicProducts: () => request('/products'),

  getAdminProducts: () => request('/admin/products'),

  createProduct: (data: any) =>
    request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: string, data: any) =>
    request(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  toggleProduct: (id: string) =>
    request(`/admin/products/${id}`, { method: 'DELETE' }),

  // 9. Staff Management & Permissions Matrix (Admin only)
  getStaffUsers: () => request('/admin/staff'),

  createStaffUser: (data: any) =>
    request('/admin/staff', { method: 'POST', body: JSON.stringify(data) }),

  updateStaffUser: (id: string, data: any) =>
    request(`/admin/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  resetStaffPassword: (id: string, newPassword: string) =>
    request(`/admin/staff/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),

  getPermissionsMatrix: () => request('/admin/staff/permissions/matrix'),

  updateStaffPermissions: (id: string, permissions: string[]) =>
    request(`/admin/staff/${id}/permissions`, { method: 'PATCH', body: JSON.stringify({ permissions }) }),

  // 10. Activity Logs (Audit Trail)
  getActivityLogs: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/activity-logs${qs ? `?${qs}` : ''}`);
  },

  // 11. Dashboards
  getAdminDashboard: () => request('/dashboard/admin'),

  getEmployeeDashboard: () => request('/dashboard/employee'),

  // 12. Employee Self-Management
  getEmployeeProfile: () => request('/employee/profile'),

  updateEmployeeProfile: (data: { name?: string; phone?: string }) =>
    request('/employee/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  changeEmployeePassword: (data: { currentPassword: string; newPassword: string }) =>
    request('/employee/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // 13. Settings & Email Inspector
  getPublicSettings: () => request('/settings'),

  getAdminSettings: () => request('/admin/settings'),

  updateAdminSettings: (data: any) =>
    request('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),

  getEmailLogs: (caseNumber?: string) => {
    const qs = caseNumber ? `?caseNumber=${encodeURIComponent(caseNumber)}` : '';
    return request(`/admin/email-logs${qs}`);
  },
};
