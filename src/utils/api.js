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
  
    // Backend sends { data: { token, role } }
    if (data.data && data.data.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('role', data.data.role);
      // Store user data for auth context
      localStorage.setItem('user', JSON.stringify({
        email,
        role: data.data.role,
        firstName: data.data.firstName || email.split('@')[0],
        id: data.data.id
      }));
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
  
    if (result.data && result.data.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify({
        email: userData.email,
        role: result.data.role || 'tenant',
        firstName: userData.firstName || userData.email?.split('@')[0],
        id: result.data.id
      }));
      return result.data;
    }
  
    return result.data || result;
  },
  
  // ====================== PROPERTIES ======================
  // UPDATED: Now supports query parameters for filtering
  getProperties: async (params = {}) => {
    // Build query string from params object
    const queryParams = new URLSearchParams();
    
    if (params.featured) queryParams.append('featured', 'true');
    if (params.latest) queryParams.append('latest', 'true');
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.location) queryParams.append('location', params.location);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/properties${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    const data = await handleResponse(response);
    
    // Handle different response structures
    if (data.data) {
      return { data: data.data }; // Return consistent structure
    }
    return data; // If it's already an array
  },

  getAllProperties: async () => {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      headers: getAuthHeaders(),
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

  getPropertyAmenities: async (propertyId) => {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/amenities`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.data; // This will be your array of amenities
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.data;
  },

  // Future endpoints (add when needed)
  createProperty: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        // Don't set Content-Type for FormData, browser handles it
      },
      body: formData,
    });
    const data = await handleResponse(response);
    return data.data;
  },

  uploadPropertyImage: async (propertyId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/images`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
    const data = await handleResponse(response);
    return data.data;
  },
};

export default api;