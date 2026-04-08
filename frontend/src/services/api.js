import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // User APIs
  register: (userData) => axiosInstance.post('/users/register', userData),
  login: (userData) => axiosInstance.post('/users/login', userData),
  getProfile: () => axiosInstance.get('/users/profile'),
  updateProfile: (userData) => axiosInstance.put('/users/profile', userData),
  uploadProfilePhoto: (formData) => axiosInstance.put('/users/profile/photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteUser: () => axiosInstance.delete('/users/profile'),

  // Admin User Management APIs
  getAllUsers: () => axiosInstance.get('/users/admin/all'),
  getUserById: (id) => axiosInstance.get(`/users/admin/${id}`),
  createUserAdmin: (userData) => axiosInstance.post('/users/admin/create', userData),
  updateUserAdmin: (id, userData) => axiosInstance.put(`/users/admin/${id}`, userData),
  deleteUserAdmin: (id) => axiosInstance.delete(`/users/admin/${id}`),
  resetUserPassword: (id, passwordData) => axiosInstance.put(`/users/admin/${id}/reset-password`, passwordData),
  toggleUserStatus: (id) => axiosInstance.put(`/users/admin/${id}/toggle-status`),

  // Meal APIs
  getMeals: (params) => axiosInstance.get('/meals', { params }),
  getMealById: (id) => axiosInstance.get(`/meals/${id}`),
  createMeal: (mealData) => axiosInstance.post('/meals', mealData),
  updateMeal: (id, mealData) => axiosInstance.put(`/meals/${id}`, mealData),
  deleteMeal: (id) => axiosInstance.delete(`/meals/${id}`),

  // Meal Plan APIs
  getMealPlans: () => axiosInstance.get('/mealplans'),
  createMealPlan: (planData) => axiosInstance.post('/mealplans', planData),
  updateMealPlan: (id, planData) => axiosInstance.put(`/mealplans/${id}`, planData),
  deleteMealPlan: (id) => axiosInstance.delete(`/mealplans/${id}`),
  getAllMealPlans: () => axiosInstance.get('/mealplans/admin/all'),

  // Order APIs
  getOrders: () => axiosInstance.get('/orders'),
  createOrder: (orderData) => axiosInstance.post('/orders', orderData),
  updateOrder: (id, orderData) => axiosInstance.put(`/orders/${id}`, orderData),
  cancelOrder: (id) => axiosInstance.delete(`/orders/${id}`),
  getAllOrders: () => axiosInstance.get('/orders/admin/all'),

  // Payment APIs
  processPayment: (paymentData) => axiosInstance.post('/payments', paymentData),
  getPayments: () => axiosInstance.get('/payments'),
  updatePaymentStatus: (id, payload) => axiosInstance.put(`/payments/${id}/status`, payload),
  getAllPayments: () => axiosInstance.get('/payments/admin/all'),
};