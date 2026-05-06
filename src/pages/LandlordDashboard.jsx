import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function LandlordDashboard() {
  const navigate = useNavigate();
  useAuth();

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    totalValue: 0,
  });

  // Inside LandlordDashboard component
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [propertyToDelete, setPropertyToDelete] = useState(null);

// This opens the modal instead of the browser confirm
const openDeleteModal = (property) => {
  setPropertyToDelete(property);
  setShowDeleteModal(true);
};

// This handles the actual DB call
const confirmDelete = async () => {
  if (!propertyToDelete) return;
  try {
    await api.deleteProperty(propertyToDelete.property_id);
    setProperties(properties.filter((p) => p.property_id !== propertyToDelete.property_id));
    setShowDeleteModal(false);
    setPropertyToDelete(null);
  } catch (err) {
    alert("Failed to delete property");
  }
};


  // Fetch only this landlord's properties from DB
  const fetchMyProperties = async () => {
    try {
      setLoading(true);
      const res = await api.getMyProperties();
      const data = res.data;
      
      // Fetch amenities for all properties in parallel
      const propertiesWithAmenities = await Promise.all(
        data.map(async (property) => {
          try {
            const amenitiesData = await api.getPropertyAmenities(property.property_id);
            return {
              ...property,
              amenities: amenitiesData || []
            };
          } catch (err) {
            console.error(`Failed to fetch amenities for property ${property.property_id}:`, err);
            return {
              ...property,
              amenities: []
            };
          }
        })
      );
      
      setProperties(propertiesWithAmenities);
    } catch (err) {
      console.error("Failed to load landlord properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProperties();
  }, []);

  // Reactive Stats & Filtering
  useEffect(() => {
    let filtered = properties.filter((p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (typeFilter !== "all") {
      filtered = filtered.filter((p) => p.property_type === typeFilter.toLowerCase());
    }

    setFilteredProperties(filtered);

    // Calculate Stats
    const total = properties.length;
    const available = properties.filter(p => p.availability_status === "available").length;
    const rented = properties.filter(p => p.availability_status === "rented").length;
    const totalValue = properties.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);

    setStats({ total, available, rented, totalValue });
  }, [properties, searchTerm, typeFilter]);


  const handleToggleStatus = async (property) => {
    const newStatus = property.availability_status === "rented" ? "available" : "rented";
    try {
      await api.updateProperty(property.property_id, { availability_status: newStatus });
      setProperties(properties.map(p => 
        p.property_id === property.property_id ? { ...p, availability_status: newStatus } : p
      ));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0b3d3d] flex items-center justify-center text-white">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-[#0b3d3d] pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Landlord Console</h1>
            <p className="text-white/60 mt-1">Manage your listings and track performance</p>
          </div>
          <Link to="/add-property">
            <button className="bg-[#fbbf24] px-8 py-3 rounded-xl font-bold text-[#0b3d3d] hover:scale-105 transition shadow-lg">
              + List New Property
            </button>
          </Link>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-6">
        <Stat title="Total Listings" value={stats.total} icon="🏘️" />
        <Stat title="Available" value={stats.available} icon="✅" />
        <Stat title="Rented" value={stats.rented} icon="🔑"/>
        <Stat title="Est. Monthly Revenue" value={`${stats.totalValue.toLocaleString()} ETB`} icon="💰" color="text-[#fbbf24]" />
      </div>

      {/* SEARCH & FILTERS */ }
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex gap-3 flex-wrap">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="border p-2 rounded flex-1 outline-none focus:ring-2 focus:ring-[#fbbf24]"
          />

          {["all", "Apartment", "House", "Villa", "Studio"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded transition ${
                typeFilter === t ? "bg-[#fbbf24] text-black font-semibold" : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {/* PROPERTY GRID */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-200">
             <p className="text-gray-500 text-lg">No properties found.</p>
             <Link to="/add-property" className="text-[#087474] font-bold mt-4 block underline">Add your first property now</Link>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 [transform:translateZ(0)]">
  {filteredProperties.map((p) => (
    <div
      key={p.property_id}
      className="bg-[#0b3d3d] text-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group border border-white/10 flex flex-col"
    >
      {/* IMAGE SECTION */}
      <div className="relative h-48 overflow-hidden bg-gray-800">
        <img
          src={p.mainImage || "https://placeholder.com"}
          alt={p.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        
        {/* Status Badge */}
        <span className={`absolute top-3 right-3 text-black text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
          p.availability_status === 'available' ? 'bg-green-400' : 'bg-[#fbbf24]'
        }`}>
          {p.availability_status}
        </span>
        
        {p.featured === 1 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
            FEATURED
          </span>
        )}
      </div>

      {/* CONTENT SECTION */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-md font-bold line-clamp-1 group-hover:text-[#fbbf24] transition">
          {p.title}
        </h3>
        <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
          📍 {p.city}, {p.district}
        </p>

        {/* BEDS / BATHS / SIZE ROW */}
        <div className="flex justify-between text-[11px] text-white/50 mt-4 border-y border-white/10 py-3">
          <span className="flex flex-col items-center"><b>{p.bedrooms}</b> Beds</span>
          <span className="flex flex-col items-center"><b>{p.bathrooms}</b> Baths</span>
          <span className="flex flex-col items-center"><b>{p.size}</b> m²</span>
        </div>

        {/* AMENITIES */}
        <div className="mt-3 flex flex-wrap gap-1 min-h-[20px]">
          {p.amenities && p.amenities.length > 0 ? (
            p.amenities.slice(0, 3).map((amenity, idx) => (
              <span 
                key={idx}
                className="bg-white/10 text-white/70 text-[9px] px-2 py-0.5 rounded-full"
              >
                {amenity.amenity_name}
              </span>
            ))
          ) : (
            <span className="text-[9px] text-white/30 italic">No amenities</span>
          )}
          {p.amenities && p.amenities.length > 3 && (
            <span className="bg-white/5 text-white/40 text-[9px] px-2 py-0.5 rounded-full">
              +{p.amenities.length - 3} more
            </span>
          )}
        </div>
        
        {/* PRICE & ACTIONS ROW */}
        <div className="mt-auto pt-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/50 uppercase">Monthly Rent</span>
              <span className="text-xl font-black text-[#fbbf24]">
                {Number(p.price).toLocaleString()} <small className="text-[10px]">ETB</small>
              </span>
            </div>
            {/* MANAGEMENT BUTTONS */}
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex gap-2">
                {/* TOGGLE BUTTON */}
                <button
                  onClick={() => handleToggleStatus(p)}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm ${
                    p.availability_status === "available"
                      ? "bg-[#fbbf24] text-[#0b3d3d] hover:bg-[#f59e0b]" // Yellowish for "Rent"
                      : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30" // Greenish for "Make Available"
                  }`}
                >
                  {p.availability_status === "available" ? "Rent" : "Make Available"}
                </button>

                {/* EDIT BUTTON */}
                <button
                  onClick={() => navigate(`/edit-property/${p.property_id}`)}
                  className="flex-1 py-2 px-3 bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-bold uppercase hover:bg-white/20 transition-all"
                >
                  Edit
                </button>
              </div>
              {/* DELETE BUTTON */}
              <button
                onClick={() => openDeleteModal(p)} // Pass the whole property object
                className="w-full py-3 px-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
              >
                Delete Property
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  ))}
</div>

        )}
      </div>
      {/* --- DELETE CONFIRMATION MODAL --- */}
{showDeleteModal && (
  <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
    {/* Backdrop Blur */}
    <div 
      className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => setShowDeleteModal(false)}
    ></div>
    
    {/* Modal Content */}
    <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-200 border border-gray-100">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🗑️
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Listing?</h3>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-gray-800">"{propertyToDelete?.title}"</span>? This action cannot be undone.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={confirmDelete}
            className="w-full px-4 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-200"
          >
            Yes, Delete Property
          </button>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="w-full px-4 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
          >
            Keep Listing
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
function Stat({ title, value, icon, color = "text-white" }) {
  return (
    <div className="bg-[#0b3d3d] p-6 rounded-lg shadow flex justify-between">
      <div>
        <p className="text-sm text-white">{title}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  );
}