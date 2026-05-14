import axios from 'axios'

const API_URL = 'https://unipazari.com/ocal/api'

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach auth token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handling — redirect to login on 401
// BUT skip the redirect when the failing request is the login itself
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client

// ── Typed API helpers ──────────────────────────────────────

export const api = {
  // Auth
  login: (email, password) => client.post('/auth/login', { email, password }),

  // Categories
  getCategories: () => client.get('/categories'),

  // Products
  getProducts: (params = {}) => client.get('/products', { params }),
  getProduct: (id) => client.get(`/products/${id}`),
  createProduct: (data) => client.post('/products', data),
  updateProduct: (id, data) => client.put(`/products/${id}`, data),
  deleteProduct: (id) => client.delete(`/products/${id}`),

  // Stock
  stockIn:      (data) => client.post('/stock/in', data),
  stockOut:     (data) => client.post('/stock/out', data),
  getMovements: (params = {}) => client.get('/stock/movements', { params }),
  getLowStock:  () => client.get('/stock/low'),

  // Sales
  getSales:  (params = {}) => client.get('/sales', { params }),
  getSale:   (id) => client.get(`/sales/${id}`),
  createSale: (data) => client.post('/sales', data),

  // Reports
  getSummary:    () => client.get('/reports/summary'),
  getDaily:      (date) => client.get('/reports/daily', { params: { date } }),
  getWeekly:     (from) => client.get('/reports/weekly', { params: { from } }),
  getMonthly:    (year, month) => client.get('/reports/monthly', { params: { year, month } }),
  getTopProducts:(params = {}) => client.get('/reports/top-products', { params }),

  // Services
  getServices:    (params = {}) => client.get('/services', { params }),
  getService:     (id) => client.get(`/services/${id}`),
  createService:  (data) => client.post('/services', data),
  updateService:  (id, data) => client.put(`/services/${id}`, data),
  completeService:(id, data) => client.put(`/services/${id}/complete`, data),

  // Customers
  getCustomers:      (params = {}) => client.get('/customers', { params }),
  searchCustomers:   (q) => client.get('/customers/search', { params: { q } }),
  getCustomer:       (id) => client.get(`/customers/${id}`),
  createCustomer:    (data) => client.post('/customers', data),
  updateCustomer:    (id, data) => client.put(`/customers/${id}`, data),
  deleteCustomer:    (id) => client.delete(`/customers/${id}`),
}
