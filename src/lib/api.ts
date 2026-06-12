/**
 * Spectrum Admin — API Client
 *
 * All requests are sent to /api/* which Next.js proxies to SPECTRUM_API_URL
 * (set in .env.local / Railway env vars).  This avoids any CORS configuration
 * on the main Spectrum Connect backend.
 */

const BASE = '/api';

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sc_admin_token');
}

export function setToken(token: string) {
  localStorage.setItem('sc_admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('sc_admin_token');
}

// ── Core request wrapper ──────────────────────────────────────────────────────

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  // Don't set Content-Type for FormData (browser adds boundary automatically).
  // Also don't overwrite a Content-Type already supplied by the caller
  // (e.g. login sends application/x-www-form-urlencoded).
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login?expired=1';
    throw new Error('Session expired — please log in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || `Request failed (HTTP ${res.status})`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  user_role: string;
  account_type: string;
  is_admin: boolean;
}

export interface PlatformStats {
  users: {
    total: number;
    creators: number;
    clients: number;
    admins: number;
    verified: number;
    suspended: number;
    new_last_30_days: number;
  };
  escrow: {
    total_volume_usd: number;
    platform_fees_usd: number;
    client_fee_usd: number;
    creator_fee_usd: number;
    active_count: number;
    completed_count: number;
    disputed_count: number;
  };
  etf: {
    total_points_awarded: number;
    platinum_users: number;
    gold_users: number;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  account_type: string;
  user_role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string | null;
  display_name: string;
  profile_picture: string;
  trust_score: number;
  trust_tier: string;
}

export interface AdminUserDetail extends AdminUser {
  profile?: {
    bio: string | null;
    tagline: string | null;
    location: string | null;
    skills: string[];
    hourly_rate_min: number | null;
    hourly_rate_max: number | null;
    portfolio_item_count: number;
  };
}

export interface UserListResponse {
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  users: AdminUser[];
}

export interface AdminJob {
  id: string;
  title: string;
  status: string;
  client_id: string;
  department: string;
  proposal_count: number;
  created_at: string | null;
}

export interface JobListResponse {
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  jobs: AdminJob[];
}

export interface AdminDispute {
  id: string;
  escrow_id: string | null;
  status: string;
  reason: string;
  raised_by: string | null;
  created_at: string | null;
}

export interface DisputeListResponse {
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  disputes: AdminDispute[];
}

export interface AdminTransaction {
  id: string;
  status: string;
  type: string;
  amount: number;
  currency: string;
  platform_fee: number;
  client_fee: number;
  creator_fee: number;
  commission_version: string | null;
  client_id: string | null;
  creator_id: string | null;
  created_at: string | null;
}

export interface TransactionListResponse {
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  transactions: AdminTransaction[];
}

export interface RevenueMonth {
  month: string;
  client_fees: number;
  creator_fees: number;
  total_fees: number;
  volume: number;
  count: number;
}

export interface RevenueReport {
  monthly: RevenueMonth[];
  totals: {
    client_fees: number;
    creator_fees: number;
    platform_total: number;
    volume: number;
    transaction_count: number;
  };
  top_projects: AdminTransaction[];
  commission_info: {
    version: string;
    client_rate_pct: number;
    creator_rate_pct: number;
    total_rate_pct: number;
    note: string;
  };
}

export interface EtfStats {
  total_accounts: number;
  total_lifetime_points: number;
  total_redeemed_points: number;
  level_breakdown: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    diamond: number;
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<string> {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);

  const data = await req<{ access_token: string }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  return data.access_token;
}

export async function getMe(): Promise<AuthUser> {
  return req<AuthUser>('/auth/me/role');
}

// ── Admin: Stats ──────────────────────────────────────────────────────────────

export async function getPlatformStats(): Promise<PlatformStats> {
  return req<PlatformStats>('/admin/stats');
}

// ── Admin: Users ──────────────────────────────────────────────────────────────

export async function listUsers(params: {
  page?: number;
  page_size?: number;
  search?: string;
  account_type?: string;
  user_role?: string;
  is_verified?: boolean;
  is_active?: boolean;
}): Promise<UserListResponse> {
  const q = new URLSearchParams();
  if (params.page)         q.set('page',         String(params.page));
  if (params.page_size)    q.set('page_size',     String(params.page_size));
  if (params.search)       q.set('search',        params.search);
  if (params.account_type) q.set('account_type',  params.account_type);
  if (params.user_role)    q.set('user_role',      params.user_role);
  if (params.is_verified !== undefined) q.set('is_verified', String(params.is_verified));
  if (params.is_active   !== undefined) q.set('is_active',   String(params.is_active));
  return req<UserListResponse>(`/admin/users?${q}`);
}

export async function getUserDetail(id: string): Promise<AdminUserDetail> {
  return req<AdminUserDetail>(`/admin/users/${id}`);
}

export async function updateUserRole(id: string, user_role: string) {
  return req(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ user_role }),
  });
}

export async function suspendUser(id: string) {
  return req(`/admin/users/${id}/suspend`, { method: 'PATCH' });
}

export async function activateUser(id: string) {
  return req(`/admin/users/${id}/activate`, { method: 'PATCH' });
}

export async function toggleVerifyUser(id: string) {
  return req(`/admin/users/${id}/verify`, { method: 'PATCH' });
}

// ── Admin: Jobs ───────────────────────────────────────────────────────────────

export async function listJobs(params: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
}): Promise<JobListResponse> {
  const q = new URLSearchParams();
  if (params.page)    q.set('page',      String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  if (params.search)  q.set('search',    params.search);
  if (params.status)  q.set('status',    params.status);
  return req<JobListResponse>(`/admin/jobs?${q}`);
}

export async function updateJobStatus(id: string, status: string) {
  return req(`/admin/jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Admin: Disputes ───────────────────────────────────────────────────────────

export async function listDisputes(params: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<DisputeListResponse> {
  const q = new URLSearchParams();
  if (params.page)   q.set('page',      String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  if (params.status) q.set('status',    params.status);
  return req<DisputeListResponse>(`/admin/disputes?${q}`);
}

// ── Admin: Transactions ───────────────────────────────────────────────────────

export async function listTransactions(params: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<TransactionListResponse> {
  const q = new URLSearchParams();
  if (params.page)   q.set('page',      String(params.page));
  if (params.page_size) q.set('page_size', String(params.page_size));
  if (params.status) q.set('status',    params.status);
  return req<TransactionListResponse>(`/admin/transactions?${q}`);
}

// ── Admin: ETF ────────────────────────────────────────────────────────────────

export async function getEtfStats(): Promise<EtfStats> {
  return req<EtfStats>('/admin/etf/stats');
}

// ── Admin: Revenue ────────────────────────────────────────────────────────────

export async function getRevenue(): Promise<RevenueReport> {
  return req<RevenueReport>('/admin/revenue');
}

// ── Health check ──────────────────────────────────────────────────────────────

export async function getHealthStatus(): Promise<{ status: string; message: string }> {
  return req<{ status: string; message: string }>('/health');
}

// ── Bulk helpers (for analytics & export) ────────────────────────────────────

/** Fetch up to 100 users in one call (for derived analytics). */
export async function getAllUsers(): Promise<AdminUser[]> {
  const res = await req<UserListResponse>('/admin/users?page=1&page_size=100');
  return res.users;
}

/** Fetch up to 100 transactions (for top-creator / top-client analytics). */
export async function getAllTransactions(): Promise<AdminTransaction[]> {
  const res = await req<TransactionListResponse>('/admin/transactions?page=1&page_size=100');
  return res.transactions;
}

/** Fetch up to 100 jobs. */
export async function getAllJobs(): Promise<AdminJob[]> {
  const res = await req<JobListResponse>('/admin/jobs?page=1&page_size=100');
  return res.jobs;
}

/** Fetch up to 100 disputes. */
export async function getAllDisputes(): Promise<AdminDispute[]> {
  const res = await req<DisputeListResponse>('/admin/disputes?page=1&page_size=100');
  return res.disputes;
}

// ── Admin: Notifications ──────────────────────────────────────────────────────

export interface NotificationSendPayload {
  recipient: 'all' | 'clients' | 'creators' | 'custom';
  user_ids?: string[];
  title: string;
  message: string;
  type?: string;
  category?: string;
  action_url?: string;
  action_text?: string;
}

export interface NotificationSendResult {
  success: boolean;
  sent_to: number;
  recipient: string;
  title: string;
  sent_at: string;
}

export interface NotificationHistoryEntry {
  id: string;
  title: string;
  message: string;
  category: string;
  actor_name: string | null;
  sent_at: string | null;
}

export async function sendAdminNotification(
  payload: NotificationSendPayload,
): Promise<NotificationSendResult> {
  return req<NotificationSendResult>('/admin/notifications/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAdminNotificationHistory(): Promise<NotificationHistoryEntry[]> {
  const res = await req<{ history: NotificationHistoryEntry[]; total: number }>(
    '/admin/notifications/history',
  );
  return res.history;
}

// ── Danger Zone: full platform data wipe ─────────────────────────────────────

export interface WipeDataResult {
  success: boolean;
  total_documents_deleted: number;
  collections: Record<string, number>;
  preserved: string[];
  message: string;
}

/**
 * Irreversibly erase all platform data except admin accounts and settings.
 * Requires the acting admin's password and the exact confirmation phrase.
 */
export async function wipeAllData(
  password: string,
  confirmation: string,
): Promise<WipeDataResult> {
  return req<WipeDataResult>('/admin/wipe-data', {
    method: 'POST',
    body: JSON.stringify({ password, confirmation }),
  });
}

// ── Call the CEO requests ─────────────────────────────────────────────────────

export type CeoCallStatus =
  | 'new' | 'under_review' | 'accepted' | 'scheduled' | 'completed' | 'declined';

export interface CeoCallRequest {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  country: string | null;
  subject: string | null;
  purpose: string;
  message: string | null;
  meeting_type: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  status: CeoCallStatus;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CeoCallListResult {
  requests: CeoCallRequest[];
  total: number;
  counts: Record<CeoCallStatus, number>;
}

export async function getCeoCalls(statusFilter?: string): Promise<CeoCallListResult> {
  const qs = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : '';
  return req<CeoCallListResult>(`/ceo-calls/admin${qs}`);
}

export async function updateCeoCall(
  id: string,
  body: { status?: CeoCallStatus; admin_notes?: string },
): Promise<{ success: boolean; request: CeoCallRequest }> {
  return req(`/ceo-calls/admin/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}
