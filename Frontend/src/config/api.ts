import axios from 'axios';

// API Configuration
// Đổi IP này sang IP máy tính của bạn nếu test trên điện thoại thật
export const API_BASE_URL = 'http://192.168.1.209:5000/api';
export const API_URL = API_BASE_URL; // Alias for compatibility

// Để lấy IP máy tính:
// Windows: mở CMD, gõ "ipconfig", tìm IPv4 Address
// Mac/Linux: mở Terminal, gõ "ifconfig", tìm inet

console.log('🌐 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
