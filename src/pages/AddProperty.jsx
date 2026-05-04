import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../utils/api.js"

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cloudflare.com",
  iconUrl: "https://cloudflare.com",
  shadowUrl: "https://cloudflare.com",
});

export default function AddProperty() {
  const navigate = useNavigate();

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

  const [images, setImages] = useState([]); // Stores { file: File, preview: string, url: string, isFile: bool }
  const [amenitiesList, setAmenitiesList] = useState([]); // From DB
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [errors, setErrors] = useState({});
  const [showMap, setShowMap] = useState(false);

  // Fetch amenities on load
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const data = await api.getAllAmenities();
        setAmenitiesList(data);
      } catch (err) {
        console.error("Failed to load amenities:", err);
        // Optional: Set a default list if the API fails
        setAmenitiesList([]); 
      }
    };
  
    fetchAmenities();
  }, []);

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
      isFile: true
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const addImageUrlField = () => {
    setImages((prev) => [...prev, { url: "", isFile: false }]);
  };

  const handleUrlChange = (index, value) => {
    const updated = [...images];
    updated[index].url = value;
    setImages(updated);
  };

  // Amenity Toggle
  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
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
  
    try {
      // 1. Prepare main property data (matching your SQL params)
      const propertyPayload = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        city: form.city,
        district: form.district,
        property_type: form.type, // Map 'type' to 'property_type'
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        size: Number(form.area),    // Map 'area' to 'size'
        latitude: form.latitude,
        longitude: form.longitude,
        availability_status: "available"
      };

  
      // 2. Create the Property
      const propertyResponse = await api.createProperty(propertyPayload);
      const newPropertyId = propertyResponse.property_id; // Use insertId from your backend
  
      // 3. Handle Amenities
      if (selectedAmenities.length > 0) {
        await api.addPropertyAmenities(newPropertyId, selectedAmenities);
      }
        
      // 4. Handle Images
      if (images.length > 0) {
        // Pass the full image objects (containing .file and .url)
        await api.addPropertyImages(newPropertyId, images);
      }

  
      alert("Property created successfully!");
      navigate("/landlord");
    } catch (error) {
      console.error("Submission error:", error);
      alert(error.message || "Failed to create property");
    }
  };
  
    // Remove an image or URL field
    const removeImage = (index) => {
      setImages((prev) => prev.filter((_, i) => i !== index));
    };
  
    // Reorder: Move item in array
    const moveImage = (index, direction) => {
      const updated = [...images];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= updated.length) return;
  
      // Swap positions
      const [movedItem] = updated.splice(index, 1);
      updated.splice(newIndex, 0, movedItem);
      setImages(updated);
    };
  

  return (
    <div className="min-h-screen bg-[#0b3d3d] px-6 py-20">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-start">
        
        {/* LEFT INFO PANEL */}
        <div className="text-white space-y-6 hidden md:block pt-8">
          <h1 className="text-4xl font-bold leading-tight">Add Your Property 🚀</h1>
          <p className="text-white/70">List your property in seconds and reach real tenants faster. 
          Make sure your details are clear and attractive.</p>
          <div className="space-y-3 text-white/80">
            <p>✔ High quality images = more bookings</p>
            <p>✔ Correct location increases visibility</p>
            <p>✔ Clear pricing builds trust</p>
          </div>
          
          <div className="bg-white/10 p-4 rounded-xl">
            <p className="text-sm text-white/70">
              Tip: Properties with images get 3x more attention.
            </p>
          </div>
        </div>

        {/* FORM CARD */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-12 mt-4 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Property Details</h2>

          <input name="title" value={form.title} placeholder="Title" onChange={handleChange} className="w-full border p-2 rounded" />
          {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}

          {/* CITY & DISTRICT */}
          <div className="grid grid-cols-2 gap-2">
            <input name="city" value={form.city} placeholder="City" onChange={handleChange} className="border p-2 rounded" />
            <input name="district" value={form.district} placeholder="District" onChange={handleChange} className="border p-2 rounded" />
          </div>

          {/* MAP SECTION */}
          <div className="space-y-2">
            <button type="button" onClick={() => setShowMap(!showMap)} className="w-full bg-gray-100 py-2 rounded border hover:bg-gray-200 transition">
              {showMap ? "Close Map" : "🗺️ Select Location on Map"}
            </button>
            {showMap && (
              <div className="h-64 w-full rounded-xl overflow-hidden border-2 border-gray-200">
                <MapContainer center={[form.latitude, form.longitude]} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker />
                </MapContainer>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <input name="latitude" value={form.latitude} readOnly className="bg-gray-50 border p-2 rounded text-xs" placeholder="Lat" />
              <input name="longitude" value={form.longitude} readOnly className="bg-gray-50 border p-2 rounded text-xs" placeholder="Lng" />
            </div>
          </div>

          {/* AMENITIES */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((amenity) => (
                <button
                  key={amenity.amenity_id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.amenity_id)}
                  className={`px-3 py-1 rounded-full text-xs border transition ${
                    selectedAmenities.includes(amenity.amenity_id) 
                    ? "bg-[#fbbf24] border-[#fbbf24] font-bold" 
                    : "bg-white border-gray-300 text-gray-600"
                  }`}
                >
                  {amenity.amenity_name}
                </button>
              ))}
            </div>
          </div>

          {/* PRICE */}
          <input name="price" type="number" value={form.price} placeholder="Price" onChange={handleChange} className="w-full border p-2 rounded" />
  
          {/* MULTI-IMAGE UPLOAD SECTION */}
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold text-gray-700">Images (Drag/Order matters)</p>
            <div className="flex gap-2">
              <input type="file" multiple onChange={handleFileChange} className="text-xs flex-1" />
              <button type="button" onClick={addImageUrlField} className="text-xs bg-gray-100 px-2 py-1 rounded border hover:bg-gray-200">
                + Add URL
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative group h-24 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  
                  {/* DELETE BUTTON (X) */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md hover:bg-red-600"
                  >
                    ✕
                  </button>

                  {/* REORDER CONTROLS (Small arrows) */}
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

                  {/* CONTENT */}
                  {img.isFile ? (
                    <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
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

          {/* GRID (Beds, Baths, Area) */}
          <div className="grid grid-cols-3 gap-2">
            <input name="bedrooms" value={form.bedrooms} placeholder="Beds" onChange={handleChange} className="border p-2 rounded" />
            <input name="bathrooms" value={form.bathrooms} placeholder="Baths" onChange={handleChange} className="border p-2 rounded" />
            <input name="area" value={form.area} placeholder="Area (sqm)" onChange={handleChange} className="border p-2 rounded" />
          </div>

          <select name="type" value={form.type} onChange={handleChange} className="w-full border p-2 rounded">
            <option>Apartment</option>
            <option>House</option>
            <option>Villa</option>
            <option>Studio</option>
          </select>

          <textarea name="description" value={form.description} placeholder="Description" onChange={handleChange} className="w-full border p-2 rounded" />

          <button className="w-full bg-[#fbbf24] py-3 rounded font-semibold hover:bg-[#f59e0b] transition">
            Save Property
          </button>
        </form>
      </div>
    </div>
  );
}
