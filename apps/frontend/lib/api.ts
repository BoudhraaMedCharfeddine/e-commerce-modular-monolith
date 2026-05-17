import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  (err) => Promise.reject(err.response?.data || err),
);

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

export const productsApi = {
  getAll: (params?: { search?: string; categoryId?: string }) => api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
};

export const ordersApi = {
  create: (data: any) => api.post('/orders', data),
  myOrders: () => api.get('/orders/my'),
  getMyOrder: (id: string) => api.get(`/orders/my/${id}`),
  cancel: (id: string) => api.patch(`/orders/my/${id}/cancel`),
  getAll: () => api.get('/orders'),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
};

export const paymentsApi = {
  initiate: (orderId: string) => api.post('/payments/initiate', { orderId }),
  process: (paymentId: string) => api.post(`/payments/${paymentId}/process`),
};

export const reviewsApi = {
  byProduct: (productId: string) => api.get(`/reviews/product/${productId}`),
  create: (data: { productId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),
};

export default api;
