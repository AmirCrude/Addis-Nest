import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../utils/api.js";

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cloudflare.com",
  iconUrl: "https://cloudflare.com",
  shadowUrl: "https://cloudflare.com",
});

export default function EditProperty() {
  const navigate = useNavigate();
  const { id } = useParams();
  const propertyId = Number(id);

  const [form, setForm] = useState({
    title: "",
    city: "",
    district: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    description: "",
    type: "Apartment",
    latitude: 9.0320,
    longitude: 38.7469,
  });

  const [images, setImages] = useState([]);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [errors, setErrors] = useState({});
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: ''
  });

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Load property and amenities

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all amenities (for selection)
        const amenities = await api.getAllAmenities();
        setAmenitiesList(amenities || []);
  
        // Fetch property details
        const data = await api.getPropertyById(propertyId);
        
        if (!data) {
          setNotification({
            show: true,
            type: 'error',
            message: 'Property not found'
          });
          setTimeout(() => navigate("/landlord"), 2000);
          return;
        }
  
        // Set form data
        setForm({
          title: data.title || "",
          city: data.city || "",
          district: data.district || "",
          price: data.price?.toString() || "",
          bedrooms: data.bedrooms?.toString() || "",
          bathrooms: data.bathrooms?.toString() || "",
          area: (data.size || data.area)?.toString() || "",
          description: data.description || "",
          type: data.property_type || data.type || "Apartment",
          latitude: data.latitude || 9.0320,
          longitude: data.longitude || 38.7469,
        });
  
        // Fetch selected amenities using the specific endpoint
        const selectedAmenitiesData = await api.getPropertyAmenities(propertyId);

        if (selectedAmenitiesData && Array.isArray(selectedAmenitiesData)) {
          const amenityIds = selectedAmenitiesData.map(a => {
            // The API might be returning objects with amenity_id, or just IDs
            const id = a.amenity_id || a.id || a;
            return id;
          });
          setSelectedAmenities(amenityIds);
        } else {
          setSelectedAmenities([]);
        }
  
        // Fetch images using the specific endpoint
        const imagesData = await api.getAllPropertyImages(propertyId);
        if (imagesData && Array.isArray(imagesData) && imagesData.length > 0) {
          const existingImages = imagesData.map(img => ({
            image_id: img.image_id,
            url: img.image_url,
            isFile: false,
            isExisting: true
          }));
          setImages(existingImages);
        }
  
      } catch (err) {
        console.error("Failed to load property:", err);
        setNotification({
          show: true,
          type: 'error',
          message: 'Failed to load property details'
        });
      } finally {
        setLoading(false);
      }
    };
  
    if (propertyId) {
      loadData();
    }
  }, [propertyId, navigate]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Map Click Handler
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setForm((prev) => ({
          ...prev,
          latitude: e.latlng.lat.toFixed(6),
          longitude: e.latlng.lng.toFixed(6),
        }));
      },
    });
    return <Marker position={[form.latitude, form.longitude]} />;
  }

  // Image Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      url: URL.createObjectURL(file),
      isFile: true,
      isExisting: false
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const addImageUrlField = () => {
    setImages((prev) => [...prev, { url: "", isFile: false, isExisting: false }]);
  };

  const handleUrlChange = (index, value) => {
    const updated = [...images];
    updated[index].url = value;
    setImages(updated);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index, direction) => {
    const updated = [...images];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updated.length) return;
    const [movedItem] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedItem);
    setImages(updated);
  };

  // Amenity Toggle
  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) => {
      if (prev.includes(id)) {
        return prev.filter((a) => a !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Required";
    if (!form.city.trim()) newErrors.city = "Required";
    if (!form.district.trim()) newErrors.district = "Required";
    if (!form.price) newErrors.price = "Required";
    if (images.length === 0) newErrors.images = "At least one image required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);

    try {
      // Update property details
      const propertyPayload = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        city: form.city,
        district: form.district,
        property_type: form.type,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        size: Number(form.area),
        latitude: form.latitude,
        longitude: form.longitude,
      };

      await api.updateProperty(propertyId, propertyPayload);

      // Update amenities
      await api.updatePropertyAmenities(propertyId, selectedAmenities);

      // Handle images - delete removed existing images
      const existingImageIds = images
        .filter(img => img.isExisting && img.image_id)
        .map(img => img.image_id);

      // Get the original image IDs that were loaded
      const originalImageIds = (await api.getAllPropertyImages(propertyId))
        .map(img => img.image_id);

      // Find images that were removed (exist in original but not in current)
      const imagesToDelete = originalImageIds.filter(id => !existingImageIds.includes(id));

      // Delete removed images
      for (const imageId of imagesToDelete) {
        await api.deletePropertyImage(propertyId, imageId);
      }

      // Add new images (files and URLs that aren't existing)
      const newImages = images.filter(img => !img.isExisting);

      if (newImages.length > 0) {
        await api.addPropertyImages(propertyId, newImages);
      }

      setNotification({
        show: true,
        type: 'success',
        message: 'Property updated successfully!'
      });

      setTimeout(() => {
        navigate("/landlord");
      }, 2000);

    } catch (error) {
      console.error("Update error:", error);
      setNotification({
        show: true,
        type: 'error',
        message: error.message || "Failed to update property"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b3d3d]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading property...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b3d3d]">
      {/* --- NOTIFICATION TOAST --- */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-[1200] animate-slide-in-right">
          <div className={`
            relative overflow-hidden rounded-2xl shadow-2xl border backdrop-blur-sm
            transition-all duration-300 max-w-md
            ${notification.type === 'success' 
              ? 'bg-emerald-50/95 border-emerald-200' 
              : 'bg-red-50/95 border-red-200'
            }
          `}>
            <div className="flex items-start gap-3 p-4 pr-12">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
                ${notification.type === 'success' 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-red-100 text-red-600'
                }
              `}>
                {notification.type === 'success' ? '✅' : '❌'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-sm mb-1 ${
                  notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'
                }`}>
                  {notification.type === 'success' ? 'Success!' : 'Error'}
                </h4>
                <p className={`text-sm leading-relaxed ${
                  notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
                  transition-colors text-xs
                  ${notification.type === 'success' 
                    ? 'hover:bg-emerald-200 text-emerald-600' 
                    : 'hover:bg-red-200 text-red-600'
                  }
                `}
              >
                ✕
              </button>
            </div>
            <div className={`h-1 w-full ${
              notification.type === 'success' ? 'bg-emerald-200' : 'bg-red-200'
            }`}>
              <div 
                className={`h-full animate-shrink-width ${
                  notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                style={{ animationDuration: '5s' }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* --- SAVING OVERLAY --- */}
      {saving && (
        <div className="fixed inset-0 z-[1150] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Updating Property</h3>
              <p className="text-gray-500 text-sm">Please wait while we save your changes...</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate("/landlord")}
            className="text-gray-600 hover:text-gray-800 transition"
          >
            ← Back to Properties
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Edit Property</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* FORM */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Property Details</h2>

          {/* TITLE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input 
              name="title" 
              value={form.title} 
              onChange={handleChange} 
              className={`w-full border p-2 rounded ${errors.title ? 'border-red-500' : ''}`} 
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>

          {/* CITY & DISTRICT */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input 
                name="city" 
                value={form.city} 
                onChange={handleChange} 
                className={`border p-2 rounded w-full ${errors.city ? 'border-red-500' : ''}`} 
              />
              {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input 
                name="district" 
                value={form.district} 
                onChange={handleChange} 
                className={`border p-2 rounded w-full ${errors.district ? 'border-red-500' : ''}`} 
              />
              {errors.district && <p className="text-red-500 text-sm">{errors.district}</p>}
            </div>
          </div>

          {/* MAP SECTION */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <button 
              type="button" 
              onClick={() => setShowMap(!showMap)} 
              className="w-full bg-gray-100 py-2 rounded border hover:bg-gray-200 transition"
            >
              {showMap ? "Close Map" : "🗺️ Select Location on Map"}
            </button>
            {showMap && (
              <div className="h-64 w-full rounded-xl overflow-hidden border-2 border-gray-200">
                <MapContainer 
                  center={[form.latitude, form.longitude]} 
                  zoom={13} 
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker />
                </MapContainer>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <input 
                name="latitude" 
                value={form.latitude} 
                readOnly 
                className="bg-gray-50 border p-2 rounded text-xs" 
                placeholder="Latitude" 
              />
              <input 
                name="longitude" 
                value={form.longitude} 
                readOnly 
                className="bg-gray-50 border p-2 rounded text-xs" 
                placeholder="Longitude" 
              />
            </div>
          </div>

          {/* PRICE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input 
              name="price" 
              type="number" 
              value={form.price} 
              onChange={handleChange} 
              className={`w-full border p-2 rounded ${errors.price ? 'border-red-500' : ''}`} 
            />
            {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
          </div>

          {/* PROPERTY TYPE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select 
              name="type" 
              value={form.type} 
              onChange={handleChange} 
              className="w-full border p-2 rounded"
            >
              <option>Apartment</option>
              <option>House</option>
              <option>Villa</option>
              <option>Studio</option>
            </select>
          </div>

          {/* AMENITIES */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((amenity) => (
                <button
                  key={amenity.amenity_id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.amenity_id)}
                  className={`px-3 py-1 rounded-full text-xs border transition ${
                    selectedAmenities.includes(amenity.amenity_id) 
                    ? "bg-[#fbbf24] border-[#fbbf24] font-bold" 
                    : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {amenity.amenity_name}
                </button>
              ))}
            </div>
          </div>

          {/* IMAGES */}
          <div className="space-y-2 border-t pt-4">
            <label className="block text-sm font-medium text-gray-700">Images</label>
            <div className="flex gap-2">
              <input type="file" multiple onChange={handleFileChange} className="text-xs flex-1" />
              <button 
                type="button" 
                onClick={addImageUrlField} 
                className="text-xs bg-gray-100 px-2 py-1 rounded border hover:bg-gray-200"
              >
                + Add URL
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative group h-24 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md hover:bg-red-600"
                  >
                    ✕
                  </button>

                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button" 
                      onClick={() => moveImage(idx, -1)} 
                      className="bg-black/50 text-white px-1 rounded text-[10px]"
                    >
                      ◀
                    </button>
                    <button 
                      type="button" 
                      onClick={() => moveImage(idx, 1)} 
                      className="bg-black/50 text-white px-1 rounded text-[10px]"
                    >
                      ▶
                    </button>
                  </div>

                  {img.url ? (
                    <img 
                      src={img.isFile ? img.preview : img.url} 
                      alt="preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex items-center h-full p-1">
                      <input 
                        placeholder="Paste URL" 
                        className="w-full text-[10px] bg-transparent outline-none text-center" 
                        value={img.url}
                        onChange={(e) => handleUrlChange(idx, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.images && <p className="text-red-500 text-xs">{errors.images}</p>}
          </div>

          {/* BEDS, BATHS, AREA */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
              <input 
                name="bedrooms" 
                type="number" 
                value={form.bedrooms} 
                onChange={handleChange} 
                className="border p-2 rounded w-full" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
              <input 
                name="bathrooms" 
                type="number" 
                value={form.bathrooms} 
                onChange={handleChange} 
                className="border p-2 rounded w-full" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqm)</label>
              <input 
                name="area" 
                type="number" 
                value={form.area} 
                onChange={handleChange} 
                className="border p-2 rounded w-full" 
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              rows="4" 
              className="w-full border p-2 rounded" 
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/landlord")}
              className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#fbbf24] text-gray-900 py-3 rounded-xl font-semibold hover:bg-[#f59e0b] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Updating...' : 'Update Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}