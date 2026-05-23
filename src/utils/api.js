// src/utils/api.js
const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
};

const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  let data = null;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.message || response.statusText || 'Request failed';
    throw new Error(errorMsg);
  }

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
  
    if (data.data && data.data.token) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('role', data.data.role);
      localStorage.setItem('user', JSON.stringify({
        email,
        role: data.data.role,
        firstName: data.data.firstName || email.split('@')[0],
        id: data.data.id
      }));
    }
  
    return data;
  },
  
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  // ====================== HOME PAGE ======================
  getHomepageData: async () => {
    const response = await fetch(`${API_BASE_URL}/homepage`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await handleResponse(response);
  },

  // ====================== PROPERTIES ======================
  
  // For filtered/paginated listing (with images)
  getProperties: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.city) queryParams.append('city', params.city);
    if (params.min_price) queryParams.append('min_price', params.min_price);
    if (params.max_price) queryParams.append('max_price', params.max_price);
    if (params.property_type) queryParams.append('property_type', params.property_type);
    if (params.min_bedrooms) queryParams.append('min_bedrooms', params.min_bedrooms);
    if (params.search) queryParams.append('search', params.search); // ADD THIS
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/properties${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response);
  },
  
  // For ALL properties (map only - no images)
  getAllPropertiesMap: async () => {
    const response = await fetch(`${API_BASE_URL}/properties/map`, {
      headers: getAuthHeaders(),
    });
    
    return await handleResponse(response);
  },

  getPropertyById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.data;
  },

  getMyProperties: async () => {
    const response = await fetch(`${API_BASE_URL}/properties/my`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  },

  createProperty: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(formData),
    });
    const data = await handleResponse(response);
    return data.data;
  },

  updateProperty: async (id, updateData) => {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    return await handleResponse(response);
  },

  deleteProperty: async (id) => {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  },

  // ====================== PROPERTY IMAGES ======================
  getAllPropertyImages: async (propertyId) => {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/images`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.data;
  },

  addPropertyImages: async (propertyId, images) => {
    const formData = new FormData();
    
    images.forEach((img) => {
      if (img.isFile) {
        formData.append("images", img.file); 
      } else if (img.url) {
        formData.append("imageUrls", img.url);
      }
    });

    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/images`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    return await handleResponse(response);
  },

  deletePropertyImage: async (propertyId, imageId) => {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/images/${imageId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  },

  // ====================== AMENITIES ======================
  getAllAmenities: async () => {
    const response = await fetch(`${API_BASE_URL}/amenities`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.data;
  },

  getPropertyAmenities: async (propertyId) => {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/amenities`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.data;
  },

  updatePropertyAmenities: async (propertyId, amenityIds) => {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/amenities`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ amenityIds }),
    });
    return await handleResponse(response);
  },

  addPropertyAmenities: async (propertyId, amenityIds) => {
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/amenities`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ amenityIds }),
    });
    return await handleResponse(response);
  },

  // ====================== USER ======================
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.data;
  },

  getUserById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    return data.data;
  },
  // ====================== BOOKINGS ======================
  createBooking: async (propertyId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${propertyId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  },

  getMyBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/bookings/my`, {
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  },

  cancelBooking: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  },

  approveBooking: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  },

  rejectBooking: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  },
};

export default api;

