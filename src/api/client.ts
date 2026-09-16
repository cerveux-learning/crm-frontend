import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Deal,
  CreateDealInput,
  UpdateDealInput,
  DealStage,
  Product,
  CreateProductInput,
  UpdateProductInput,
  StockMovement,
  CreateStockEntryInput,
  SaleOrder,
  CreateSaleOrderInput,
  CreateActivityInput,
  Activity,
  DashboardMetrics,
  MonthlySalesData,
  DealsByStageData,
  TopCustomerData,
  TopProductData,
  User,
  AuthUser,
  AuthResponse,
  LoginInput,
  ChangePasswordInput,
  CreateUserInput,
  UpdateUserInput,
  NextContact,
  CreateNextContactInput,
  UpdateNextContactInput,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'crm_auth_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

let refreshPromise: Promise<string | null> | null = null;

async function requestNewToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as AuthResponse;
    if (data.token && data.refreshToken) {
      tokenStorage.set(data.token);
      tokenStorage.setRefreshToken(data.refreshToken);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchJSON<T>(url: string, options?: RequestInit, isRetry = false): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && !isRetry && !url.startsWith('/auth/login') && !url.startsWith('/auth/refresh')) {
      // Attempt token refresh
      if (!refreshPromise) {
        refreshPromise = requestNewToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        return fetchJSON<T>(url, options, true);
      } else {
        tokenStorage.clear();
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    } else if (res.status === 401 && (url.startsWith('/auth/refresh') || isRetry)) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    let errorMessage = `HTTP Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) {
        errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      }
    } catch { }
    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  auth: {
    login: (data: LoginInput) => fetchJSON<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    refreshToken: (refreshToken: string) => fetchJSON<AuthResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    logout: () => fetchJSON<{ message: string }>('/auth/logout', { method: 'POST' }),
    getMe: () => fetchJSON<AuthUser>('/auth/me'),
    changePassword: (data: ChangePasswordInput) => fetchJSON<{ message: string }>('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  },

  users: {
    getAll: (search?: string, role?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role && role !== 'ALL') params.append('role', role);
      return fetchJSON<(User & { _count: { sales: number; deals: number } })[]>(`/users?${params.toString()}`);
    },
    getSellers: () => fetchJSON<{ id: string; name: string; email: string; role: string }[]>('/users/sellers'),
    getById: (id: string) => fetchJSON<User & { _count: { sales: number; deals: number } }>(`/users/${id}`),
    create: (data: CreateUserInput) => fetchJSON<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateUserInput) => fetchJSON<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJSON<void>(`/users/${id}`, { method: 'DELETE' }),
  },

  analytics: {
    getDashboard: () =>
      fetchJSON<{
        metrics: DashboardMetrics;
        monthlySales: MonthlySalesData[];
        dealsByStage: DealsByStageData[];
        topCustomers: TopCustomerData[];
        topProducts: TopProductData[];
      }>('/analytics/dashboard'),
  },

  customers: {
    getAll: (search?: string, status?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      return fetchJSON<Customer[]>(`/customers?${params.toString()}`);
    },
    getById: (id: string) => fetchJSON<Customer & { deals: Deal[]; sales: SaleOrder[]; activities: Activity[]; nextContacts: NextContact[] }>(`/customers/${id}`),
    create: (data: CreateCustomerInput) => fetchJSON<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateCustomerInput) => fetchJSON<Customer>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJSON<void>(`/customers/${id}`, { method: 'DELETE' }),
    addActivity: (id: string, data: CreateActivityInput) => fetchJSON<Activity>(`/customers/${id}/activities`, { method: 'POST', body: JSON.stringify(data) }),
  },

  nextContacts: {
    getAll: (filters?: { customerId?: string; userId?: string; done?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.done !== undefined) params.append('done', String(filters.done));
      return fetchJSON<NextContact[]>(`/next-contacts?${params.toString()}`);
    },
    getMyAgenda: (includeDone?: boolean) => {
      const params = new URLSearchParams();
      if (includeDone) params.append('includeDone', 'true');
      return fetchJSON<{ overdue: NextContact[]; today: NextContact[]; upcoming: NextContact[] }>(
        `/next-contacts/my-agenda?${params.toString()}`
      );
    },
    getById: (id: string) => fetchJSON<NextContact>(`/next-contacts/${id}`),
    create: (data: CreateNextContactInput) => fetchJSON<NextContact>('/next-contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateNextContactInput) => fetchJSON<NextContact>(`/next-contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJSON<void>(`/next-contacts/${id}`, { method: 'DELETE' }),
  },

  deals: {
    getAll: (filters?: { stage?: string; priority?: string; customerId?: string; search?: string; userId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.stage) params.append('stage', filters.stage);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.userId) params.append('userId', filters.userId);
      return fetchJSON<Deal[]>(`/deals?${params.toString()}`);
    },
    getById: (id: string) => fetchJSON<Deal & { customer: Customer; activities: Activity[] }>(`/deals/${id}`),
    create: (data: CreateDealInput) => fetchJSON<Deal>('/deals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateDealInput) => fetchJSON<Deal>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStage: (id: string, stage: DealStage) => fetchJSON<Deal>(`/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
    delete: (id: string) => fetchJSON<void>(`/deals/${id}`, { method: 'DELETE' }),
  },

  products: {
    getAll: (category?: string, search?: string) => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      return fetchJSON<Product[]>(`/products?${params.toString()}`);
    },
    getById: (id: string) => fetchJSON<Product>(`/products/${id}`),
    create: (data: CreateProductInput) => fetchJSON<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateProductInput) => fetchJSON<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJSON<void>(`/products/${id}`, { method: 'DELETE' }),
  },

  stock: {
    getMovements: (filters?: { productId?: string; type?: string; startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams();
      if (filters?.productId) params.append('productId', filters.productId);
      if (filters?.type && filters.type !== 'ALL') params.append('type', filters.type);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      return fetchJSON<StockMovement[]>(`/stock/movements?${params.toString()}`);
    },
    createEntry: (data: CreateStockEntryInput) =>
      fetchJSON<{ movement: StockMovement; product: Product }>('/stock/entry', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  sales: {
    getAll: (filters?: { type?: string; status?: string; customerId?: string; search?: string; userId?: string }) => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.search) params.append('search', filters.search);
      return fetchJSON<SaleOrder[]>(`/sales?${params.toString()}`);
    },
    getById: (id: string) => fetchJSON<SaleOrder>(`/sales/${id}`),
    create: (data: CreateSaleOrderInput) => fetchJSON<SaleOrder>('/sales', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => fetchJSON<SaleOrder>(`/sales/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    convertQuoteToInvoice: (id: string) => fetchJSON<SaleOrder>(`/sales/${id}/convert-to-invoice`, { method: 'POST' }),
    delete: (id: string) => fetchJSON<void>(`/sales/${id}`, { method: 'DELETE' }),
  },
};
