import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../utils/api.js";

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function EditProperty() {
  const navigate = useNavigate();
  const { id } = useParams();
  const propertyId = Number(id);

  const [form, setForm] = useState({
    title: "",
    description: "",
    district: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    type: "Apartment",
    latitude: "9.0320",
    longitude: "38.7469",
    floor: "",
    totalFloors: "",
    parkingSpaces: "",
    furnishing: "",
  });

  const [images, setImages] = useState([]);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [errors, setErrors] = useState({});
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const amenities = await api.getAllAmenities();
        setAmenitiesList(amenities || []);
  
        const data = await api.getPropertyById(propertyId);
        
        if (!data) {
          setNotification({ show: true, type: 'error', message: 'Property not found' });
          setTimeout(() => navigate("/landlord"), 2000);
          return;
        }
  
        setForm({
          title: data.title || "",
          description: data.description || "",
          district: data.district || "",
          price: data.price?.toString() || "",
          bedrooms: data.bedrooms?.toString() || "",
          bathrooms: data.bathrooms?.toString() || "",
          area: (data.size || data.area)?.toString() || "",
          type: data.property_type || data.type || "Apartment",
          latitude: (data.latitude || 9.0320).toString(),
          longitude: (data.longitude || 38.7469).toString(),
          floor: data.floor_number?.toString() || "",
          totalFloors: data.total_floors?.toString() || "",
          parkingSpaces: data.parking_spaces?.toString() || "",
          furnishing: data.furnishing || "",
        });
  
        const selectedAmenitiesData = await api.getPropertyAmenities(propertyId);
        if (selectedAmenitiesData && Array.isArray(selectedAmenitiesData)) {
          const amenityIds = selectedAmenitiesData.map(a => a.amenity_id || a.id || a);
          setSelectedAmenities(amenityIds);
        } else {
          setSelectedAmenities([]);
        }
  
        const imagesData = await api.getAllPropertyImages(propertyId);
        if (imagesData && Array.isArray(imagesData) && imagesData.length > 0) {
          const existingImages = imagesData.map(img => ({
            image_id: img.image_id,
            url: img.image_url,
            preview: img.image_url,
            isFile: false,
            isExisting: true
          }));
          setImages(existingImages);
        }
  
      } catch (err) {
        console.error("Failed to load property:", err);
        setNotification({ show: true, type: 'error', message: 'Failed to load property details' });
      } finally {
        setLoading(false);
      }
    };
  
    if (propertyId) loadData();
  }, [propertyId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

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
    return <Marker position={[parseFloat(form.latitude), parseFloat(form.longitude)]} />;
  }

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

  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setForm(prev => ({
      ...prev,
      type: newType,
      bedrooms: newType === 'Commercial' ? '' : prev.bedrooms,
      bathrooms: newType === 'Commercial' ? '' : prev.bathrooms,
      floor: (newType === 'House' || newType === 'Villa') ? '' : prev.floor,
      parkingSpaces: newType !== 'Commercial' ? '' : prev.parkingSpaces,
      furnishing: newType === 'Commercial' ? '' : prev.furnishing,
    }));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Required";
    if (!form.district.trim()) newErrors.district = "Required";
    if (!form.price) newErrors.price = "Required";
    if (form.type !== 'Commercial') {
      if (!form.bedrooms) newErrors.bedrooms = "Required";
      if (!form.bathrooms) newErrors.bathrooms = "Required";
    }
    if ((form.type === 'Apartment' || form.type === 'Commercial') && !form.floor) {
      newErrors.floor = "Required";
    }
    if (images.length === 0) newErrors.images = "At least one image required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);

    try {
      const propertyPayload = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        city: "Addis Ababa",
        district: form.district,
        property_type: form.type,
        size: Number(form.area),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        availability_status: "available"
      };

      if (form.type !== 'Commercial') {
        propertyPayload.bedrooms = Number(form.bedrooms);
        propertyPayload.bathrooms = Number(form.bathrooms);
      }
      
      if (form.type === 'Apartment' || form.type === 'Commercial') {
        propertyPayload.floor_number = Number(form.floor);
        if (form.totalFloors) propertyPayload.total_floors = Number(form.totalFloors);
      }
      
      if (form.type === 'Commercial' && form.parkingSpaces) {
        propertyPayload.parking_spaces = Number(form.parkingSpaces);
      }
      
      if (form.type !== 'Commercial' && form.furnishing) {
        propertyPayload.furnishing = form.furnishing;
      }

      await api.updateProperty(propertyId, propertyPayload);
      await api.updatePropertyAmenities(propertyId, selectedAmenities);

      const existingImageIds = images
        .filter(img => img.isExisting && img.image_id)
        .map(img => img.image_id);

      const currentImages = await api.getAllPropertyImages(propertyId);
      const originalImageIds = currentImages.map(img => img.image_id);

      const imagesToDelete = originalImageIds.filter(id => !existingImageIds.includes(id));

      for (const imageId of imagesToDelete) {
        await api.deletePropertyImage(propertyId, imageId);
      }

      const newImages = images.filter(img => !img.isExisting);
      if (newImages.length > 0) {
        await api.addPropertyImages(propertyId, newImages);
      }

      setNotification({ show: true, type: 'success', message: 'Property updated successfully!' });
      setTimeout(() => navigate("/landlord"), 2000);

    } catch (error) {
      console.error("Update error:", error);
      setNotification({ show: true, type: 'error', message: error.message || "Failed to update property" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafb] pt-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading property...</p>
        </div>
      </div>
    );
  }

  const inputBase = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[#087474] focus:border-transparent outline-none transition-all placeholder:text-gray-400";
  const labelBase = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-24 right-4 z-[1200] animate-slide-in-right">
          <div className={`rounded-2xl shadow-2xl border backdrop-blur-sm max-w-md ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3 p-4 pr-12">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {notification.type === 'success' ? '✓' : '✗'}
              </div>
              <div>
                <h4 className={`font-bold text-sm mb-0.5 ${notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
                  {notification.type === 'success' ? 'Success' : 'Error'}
                </h4>
                <p className={`text-sm ${notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{notification.message}</p>
              </div>
              <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-black/10">✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Saving Overlay */}
      {saving && (
        <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Updating Property</h3>
            <p className="text-gray-500 text-sm">Saving your changes...</p>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0b3d3d] to-[#087474] rounded-2xl p-8 mb-8 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/landlord")}
                className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold">Edit Property</h1>
                <p className="text-white/70 text-sm mt-1">Update your property details below</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              
              {/* LEFT COLUMN - Takes 3/5 */}
              <div className="lg:col-span-3 space-y-5">
                
                {/* Basic Information Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0b3d3d] rounded-lg flex items-center justify-center text-[#fbbf24] text-sm font-bold">1</div>
                      <h2 className="font-semibold text-gray-800">Basic Information</h2>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={labelBase}>Property Title</label>
                        <input name="title" value={form.title} placeholder="e.g., Modern 2BR Apartment in Bole" onChange={handleChange} className={inputBase} />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                      </div>
                      <div>
                        <label className={labelBase}>Property Type</label>
                        <select name="type" value={form.type} onChange={handleTypeChange} className={inputBase}>
                          <option value="Apartment">Apartment</option>
                          <option value="House">House</option>
                          <option value="Villa">Villa</option>
                          <option value="Studio">Studio</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelBase}>Monthly Rent (ETB)</label>
                        <input name="price" type="number" value={form.price} placeholder="0" onChange={handleChange} className={inputBase} />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                      </div>
                    </div>
                    <div>
                      <label className={labelBase}>Description</label>
                      <textarea name="description" value={form.description} placeholder="Describe your property in detail..." onChange={handleChange} rows={3} className={`${inputBase} resize-none`} />
                    </div>
                  </div>
                </div>

                {/* Property Details Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0b3d3d] rounded-lg flex items-center justify-center text-[#fbbf24] text-sm font-bold">2</div>
                      <h2 className="font-semibold text-gray-800">Property Details</h2>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {form.type !== 'Commercial' ? (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={labelBase}>Bedrooms</label>
                            <input name="bedrooms" type="number" value={form.bedrooms} placeholder="Beds" onChange={handleChange} className={inputBase} />
                            {errors.bedrooms && <p className="text-red-500 text-xs mt-1">{errors.bedrooms}</p>}
                          </div>
                          <div>
                            <label className={labelBase}>Bathrooms</label>
                            <input name="bathrooms" type="number" value={form.bathrooms} placeholder="Baths" onChange={handleChange} className={inputBase} />
                            {errors.bathrooms && <p className="text-red-500 text-xs mt-1">{errors.bathrooms}</p>}
                          </div>
                          <div>
                            <label className={labelBase}>Area (m²)</label>
                            <input name="area" type="number" value={form.area} placeholder="Size" onChange={handleChange} className={inputBase} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelBase}>Furnishing</label>
                            <select name="furnishing" value={form.furnishing} onChange={handleChange} className={inputBase}>
                              <option value="">Select status</option>
                              <option value="furnished">Furnished</option>
                              <option value="semi-furnished">Semi-Furnished</option>
                              <option value="unfurnished">Unfurnished</option>
                            </select>
                          </div>
                          {(form.type === 'Apartment' || form.type === 'Studio') && (
                            <div>
                              <label className={labelBase}>Floor Number</label>
                              <input name="floor" type="number" value={form.floor} placeholder="Floor" onChange={handleChange} className={inputBase} />
                              {errors.floor && <p className="text-red-500 text-xs mt-1">{errors.floor}</p>}
                            </div>
                          )}
                        </div>
                        {(form.type === 'Apartment' || form.type === 'Studio') && (
                          <div>
                            <label className={labelBase}>Total Floors in Building</label>
                            <input name="totalFloors" type="number" value={form.totalFloors} placeholder="e.g., 5" onChange={handleChange} className={inputBase} />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={labelBase}>Area (m²)</label>
                            <input name="area" type="number" value={form.area} placeholder="Size" onChange={handleChange} className={inputBase} />
                          </div>
                          <div>
                            <label className={labelBase}>Floor</label>
                            <input name="floor" type="number" value={form.floor} placeholder="Floor" onChange={handleChange} className={inputBase} />
                            {errors.floor && <p className="text-red-500 text-xs mt-1">{errors.floor}</p>}
                          </div>
                          <div>
                            <label className={labelBase}>Parking</label>
                            <input name="parkingSpaces" type="number" value={form.parkingSpaces} placeholder="Spots" onChange={handleChange} className={inputBase} />
                          </div>
                        </div>
                        <div>
                          <label className={labelBase}>Total Floors in Building</label>
                          <input name="totalFloors" type="number" value={form.totalFloors} placeholder="e.g., 5" onChange={handleChange} className={inputBase} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Amenities Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0b3d3d] rounded-lg flex items-center justify-center text-[#fbbf24] text-sm font-bold">3</div>
                      <h2 className="font-semibold text-gray-800">Amenities</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {amenitiesList.map((amenity) => (
                        <button
                          key={amenity.amenity_id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.amenity_id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedAmenities.includes(amenity.amenity_id) 
                            ? "bg-[#0b3d3d] text-[#fbbf24] shadow-sm" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {selectedAmenities.includes(amenity.amenity_id) && "✓ "}
                          {amenity.amenity_name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Takes 2/5 */}
              <div className="lg:col-span-2 space-y-5">
                
                {/* Location Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0b3d3d] rounded-lg flex items-center justify-center text-[#fbbf24] text-sm font-bold">4</div>
                      <h2 className="font-semibold text-gray-800">Location</h2>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className={labelBase}>Sub City</label>
                      <input name="district" value={form.district} placeholder="Bole, Kazanchis, CMC..." onChange={handleChange} className={inputBase} />
                      {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
                    </div>
                    <div>
                      <label className={labelBase}>Coordinates</label>
                      <div className="flex gap-2">
                        <input name="latitude" value={form.latitude} placeholder="Latitude" onChange={handleChange} className={inputBase} />
                        <input name="longitude" value={form.longitude} placeholder="Longitude" onChange={handleChange} className={inputBase} />
                        <button type="button" onClick={() => setShowMap(!showMap)} className="px-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center justify-center flex-shrink-0" title="Open map">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>
                      {showMap && (
                        <div className="h-48 rounded-xl overflow-hidden border-2 border-gray-200 mt-3">
                          <MapContainer center={[parseFloat(form.latitude), parseFloat(form.longitude)]} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationMarker />
                          </MapContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Images Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#0b3d3d] rounded-lg flex items-center justify-center text-[#fbbf24] text-sm font-bold">5</div>
                      <h2 className="font-semibold text-gray-800">Images</h2>
                      <span className="text-xs text-red-400 ml-auto">* Required</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#087474] hover:bg-gray-50 transition group">
                      <svg className="w-8 h-8 text-gray-400 group-hover:text-[#087474] mb-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-sm text-gray-500">Click to upload</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</p>
                      <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*" />
                    </label>
                    {images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img src={img.preview || img.url} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.images && <p className="text-red-500 text-xs">{errors.images}</p>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/landlord")}
                    className="flex-1 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition font-medium text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-[#0b3d3d] text-white py-3 rounded-xl font-semibold hover:bg-[#087474] transition-all disabled:opacity-50 shadow-lg shadow-[#0b3d3d]/20"
                  >
                    {saving ? 'Updating...' : 'Update Property'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}