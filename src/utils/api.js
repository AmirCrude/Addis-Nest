// src/utils/api.js
const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const handleResponse = async (response) => {
  // 1. Get the content type to see if it's actually JSON
  const contentType = response.headers.get("content-type");
  let data = null;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  // 2. Check if the HTTP status is in the 200-299 range
  if (!response.ok) {
    // Try to use the error message from the backend, fallback to status text
    const errorMsg = data?.message || response.statusText || 'Request failed';
    throw new Error(errorMsg);
  }

  // 3. Handle cases where the backend says "success: false" even with a 200 OK
  if (data && data.success === false) {
    throw new Error(data.message || 'Operation failed');
  }

  return data;
};
export const api = {
  // ====================== AUTH ======================
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  
    const data = await handleResponse(response);
  
    // UPDATED: Backend sends { data: { token, role } }
    if (data.data && data.data.token) {
      localStorage.setItem('token', data.data.token);
      // Optional: Store the role too if you need it for UI logic
      localStorage.setItem('role', data.data.role); 
    }
  
    return data; // Returns the full backend object
  },
  
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  
    const result = await handleResponse(response);
  
    // Use optional chaining or a check to prevent the crash
    if (result.data && result.data.token) {
      localStorage.setItem('token', result.data.token);
      return result.data;
    }
  
    // Return the data object even if token isn't there,
    // or return an empty object to satisfy the frontend caller
    return result.data || result;
  },
  
  // ====================== PROPERTIES ======================
  getAllProperties: async () => {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      headers: getAuthHeaders(), // safe even for public route
    });
    const data = await handleResponse(response);
    return data.data; // array of properties
  },

  getPropertyById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.data; // single property object
  },

  // Future endpoints (add when needed)
  // createProperty: async (formData) => { ... },
  // uploadPropertyImage: async (propertyId, file) => { ... },
};

export default api;