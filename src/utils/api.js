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
};

export default api;


































































// // src/utils/api.js
// const API_BASE_URL = 'http://localhost:5000/api';

// const getAuthHeaders = () => {
//   const token = localStorage.getItem('token');
//   return token ? { Authorization: `Bearer ${token}` } : {};
// };

// const handleResponse = async (response) => {
//   // 1. Get the content type to see if it's actually JSON
//   const contentType = response.headers.get("content-type");
//   let data = null;

//   if (contentType && contentType.includes("application/json")) {
//     data = await response.json();
//   }

//   // 2. Check if the HTTP status is in the 200-299 range
//   if (!response.ok) {
//     // Try to use the error message from the backend, fallback to status text
//     const errorMsg = data?.message || response.statusText || 'Request failed';
//     throw new Error(errorMsg);
//   }

//   // 3. Handle cases where the backend says "success: false" even with a 200 OK
//   if (data && data.success === false) {
//     throw new Error(data.message || 'Operation failed');
//   }

//   return data;
// };

// export const api = {
//   // ====================== AUTH ======================
//   login: async (email, password) => {
//     const response = await fetch(`${API_BASE_URL}/auth/login`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password }),
//     });
  
//     const data = await handleResponse(response);
  
//     // Backend sends { data: { token, role } }
//     if (data.data && data.data.token) {
//       localStorage.setItem('token', data.data.token);
//       localStorage.setItem('role', data.data.role);
//       // Store user data for auth context
//       localStorage.setItem('user', JSON.stringify({
//         email,
//         role: data.data.role,
//         firstName: data.data.firstName || email.split('@')[0],
//         id: data.data.id
//       }));
//     }
  
//     return data; // Returns the full backend object
//   },
  
//   register: async (userData) => {
//     const response = await fetch(`${API_BASE_URL}/register`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(userData),
//     });
  
//     const result = await handleResponse(response);
  
//     if (result.data && result.data.token) {
//       localStorage.setItem('token', result.data.token);
//       localStorage.setItem('user', JSON.stringify({
//         email: userData.email,
//         role: result.data.role || 'tenant',
//         firstName: userData.firstName || userData.email?.split('@')[0],
//         id: result.data.id
//       }));
//       return result.data;
//     }
  
//     return result.data || result;
//   },

//   // ====================== HOME PAGE ======================
//   getHomepageData: async () => {
//     const response = await fetch(`${API_BASE_URL}`, { // Or `${API_BASE_URL}/` based on your route choice
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });
//     return await handleResponse(response);
//   },

  
//   // ====================== PROPERTIES ======================
//   // UPDATED: Now supports query parameters for filtering
//   getProperties: async (params = {}) => {
//     // Build query string from params object
//     const queryParams = new URLSearchParams();
    
//     if (params.featured) queryParams.append('featured', 'true');
//     if (params.latest) queryParams.append('latest', 'true');
//     if (params.minPrice) queryParams.append('minPrice', params.minPrice);
//     if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
//     if (params.location) queryParams.append('location', params.location);
//     if (params.limit) queryParams.append('limit', params.limit);
    
//     const queryString = queryParams.toString();
//     const url = `${API_BASE_URL}/properties${queryString ? `?${queryString}` : ''}`;
    
//     const response = await fetch(url, {
//       headers: getAuthHeaders(),
//     });
    
//     const data = await handleResponse(response);
    
//     // Handle different response structures
//     if (data.data) {
//       return { data: data.data }; // Return consistent structure
//     }
//     return data; // If it's already an array
//   },


// getAllProperties: async (filters = {}) => {
//   // 1. Convert the filters object { page: 2, limit: 12 } into a string "page=2&limit=12"
//   const queryString = new URLSearchParams(filters).toString();
  
//   // 2. Append the query string to the URL
//   const url = queryString 
//     ? `${API_BASE_URL}/properties?${queryString}` 
//     : `${API_BASE_URL}/properties`;

//   const response = await fetch(url, {
//     headers: getAuthHeaders(),
//   });

//   const resData = await handleResponse(response);
  
//   // 3. IMPORTANT: Return the WHOLE object, not just data.data
//   // We need resData.totalPages and resData.totalItems for the pagination UI!
//   return resData; 
// },


// getMyProperties: async () => {
//   const response = await fetch(`${API_BASE_URL}/properties/my`, {
//     headers: getAuthHeaders(), // Ensure this sends the JWT token
//   });
//   return await handleResponse(response);
// },

// deleteProperty: async (id) => {
//   const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
//     method: 'DELETE',
//     headers: getAuthHeaders(),
//   });
//   return await handleResponse(response);
// },

// updateProperty: async (id, updateData) => {
//   const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
//     method: 'PUT',
//     headers: {
//       ...getAuthHeaders(),
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(updateData),
//   });
//   return await handleResponse(response);
// },



//   getPropertyById: async (id) => {
//     const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
//       headers: getAuthHeaders(),
//     });
//     const data = await handleResponse(response);
//     return data.data; // single property object
//   },

//   getAllAmenities: async () => {
//     const response = await fetch(`${API_BASE_URL}/amenities`, {
//       headers: getAuthHeaders(),
//     });
//     const data = await handleResponse(response);
//     // Based on your backend code: res.status(200).json({ success: true, data: amenities })
//     return data.data; 
//   },

//   getPropertyAmenities: async (propertyId) => {
//     const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/amenities`, {
//       headers: getAuthHeaders(),
//     });
//     const data = await handleResponse(response);
//     return data.data; // This will be your array of amenities
//   },

//   getAllPropertyImages: async (propertyId) => {
//     const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/images`, {
//       headers: getAuthHeaders(),
//     });
//     const data = await handleResponse(response);
//     console.log("Fetched property images:", data.data); // Log the fetched images
//     return data.data; // array of property images
//   },

//   // Get current user profile
//   getCurrentUser: async () => {
//     const response = await fetch(`${API_BASE_URL}/auth/me`, {
//       headers: getAuthHeaders(),
//     });
//     const data = await handleResponse(response);
//     return data.data;
//   },

//   // Future endpoints (add when needed)
//   createProperty: async (formData) => {
//     const response = await fetch(`${API_BASE_URL}/properties`, {
//       method: 'POST',
//       headers: {
//         ...getAuthHeaders(),
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(formData),
//     });
//     const data = await handleResponse(response);
//     return data.data;
//   },

// // api.js

//   addPropertyImages: async (propertyId, images) => {
//     const formData = new FormData();
    
//     images.forEach((img) => {
//       if (img.isFile) {
//         // Append actual File objects
//         formData.append("images", img.file); 
//       } else if (img.url) {
//         // Append URL strings (backend must handle both strings and files)
//         formData.append("imageUrls", img.url);
//       }
//     });

//     const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/images`, {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${localStorage.getItem("token")}`, // Ensure token is here
//         // IMPORTANT: Leave Content-Type empty for FormData
//       },
//       body: formData,
//     });

//     return await handleResponse(response);
//   },

  
//   addPropertyAmenities: async (propertyId, amenityIds) => {
//     const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/amenities`, {
//       method: "POST",
//       headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
//       body: JSON.stringify({ amenityIds }),
//     });
//     return await handleResponse(response);
//   },

//   getAllPropertiesMap: async (filters = {}) => {
    
//     // 2. Append the query string to the URL
//     const url = `${API_BASE_URL}/properties`;
  
//     const response = await fetch(url, {
//       headers: getAuthHeaders(),
//     });
  
//     const resData = await handleResponse(response);
    
//     // 3. IMPORTANT: Return the WHOLE object, not just data.data
//     // We need resData.totalPages and resData.totalItems for the pagination UI!
//     return resData; 
//   },
// };

// export default api;