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

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingAction, setBookingAction] = useState(""); // "approve" or "reject"

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  const openDeleteModal = (property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

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

  const fetchMyProperties = async () => {
    try {
      setLoading(true);
      const res = await api.getMyProperties();
      const data = res.data;
      
      const propertiesWithDetails = await Promise.all(
        data.map(async (property) => {
          try {
            const [amenitiesData, imagesData] = await Promise.all([
              api.getPropertyAmenities(property.property_id),
              api.getAllPropertyImages(property.property_id)
            ]);
            
            return {
              ...property,
              amenities: amenitiesData || [],
              images: imagesData || []
            };
          } catch (err) {
            console.error(`Failed to fetch details for property ${property.property_id}:`, err);
            return {
              ...property,
              amenities: [],
              images: []
            };
          }
        })
      );
      
      setProperties(propertiesWithDetails);
    } catch (err) {
      console.error("Failed to load landlord properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProperties();
    fetchBookings();
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
    console.log("Properties: ", properties)

    setStats({ total, available, rented, totalValue });
  }, [properties, searchTerm, typeFilter]);

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const res = await api.getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const openBookingModal = (booking, action) => {
    setSelectedBooking(booking);
    setBookingAction(action);
    setShowBookingModal(true);
  };
  
  const confirmBookingAction = async () => {
    if (!selectedBooking) return;
    try {
      if (bookingAction === "approve") {
        await api.approveBooking(selectedBooking.booking_id);
      } else {
        await api.rejectBooking(selectedBooking.booking_id);
      }
      // Refresh bookings and properties
      await fetchBookings();
      await fetchMyProperties();
      setShowBookingModal(false);
      setSelectedBooking(null);
    } catch (err) {
      alert(err.message || "Failed to process booking");
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

      {/* BOOKINGS SECTION */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <h2 className="font-semibold text-gray-800">Booking Requests</h2>
              {bookings.filter(b => b.status === 'pending').length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {bookings.filter(b => b.status === 'pending').length} Pending
                </span>
              )}
            </div>
          </div>
          
          <div className="p-4">
            {bookingsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-[#087474] border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No booking requests yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bookings.map((booking) => (
                  <div
                    key={booking.booking_id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                  >
                    {/* Tenant Avatar */}
                    <div className="w-10 h-10 bg-[#0b3d3d] rounded-full flex items-center justify-center text-[#fbbf24] font-bold text-sm flex-shrink-0">
                      {booking.tenant_name?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                    
                    {/* Booking Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {booking.tenant_name}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          booking.status === 'approved' ? 'bg-green-100 text-green-700' :
                          booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        wants to rent <span className="font-medium text-gray-700">{booking.title}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                        <span>{booking.tenant_email}</span>
                        {booking.tenant_phone && <span>• {booking.tenant_phone}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => openBookingModal(booking, "approve")}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openBookingModal(booking, "reject")}
                          className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
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
                  src={p.images?.[0]?.image_url 
                    ? `http://localhost:5000${p.images[0].image_url}` 
                    : (p.mainImage || `https://picsum.photos/seed/${p.property_id}/800/600`)
                  }
                  alt={p.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/seed/${p.property_id}/800/600`;
                  }}
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
                  <p className="text-white/90 text-xs mt-1 flex items-center gap-1">
                    <span className="text-white/50">📍</span>
                    <span className="font-bold text-[#fbbf24]">{p.district}</span>
                    <span className="text-white/50">|</span>
                    <span className="text-white/60">{p.city}</span>
                  </p>

                  {/* BEDS / BATHS / SIZE ROW */}
                  <div className="flex justify-between text-[11px] text-white/50 mt-4 border-y border-white/10 py-3">
                    {p.bedrooms > 0 && (
                      <span className="flex flex-col items-center"><b>{p.bedrooms}</b> Beds</span>
                    )}
                    {p.bathrooms > 0 && (
                      <span className="flex flex-col items-center"><b>{p.bathrooms}</b> Baths</span>
                    )}
                    {p.size > 0 && (
                      <span className="flex flex-col items-center"><b>{p.size}</b> m²</span>
                    )}
                    {p.floor_number > 0 && (
                      <span className="flex flex-col items-center"><b>{p.floor_number}</b> Floor</span>
                    )}
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
                    </div>
                    
                    {/* MANAGEMENT BUTTONS */}
                    <div className="flex flex-col gap-2">
                      {/* EDIT BUTTON */}
                      <button
                        onClick={() => navigate(`/edit-property/${p.property_id}`)}
                        className="w-full py-2 px-3 bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-bold uppercase hover:bg-white/20 transition-all"
                      >
                        Edit Property
                      </button>
                      
                      {/* DELETE BUTTON */}
                      <button
                        onClick={() => openDeleteModal(p)}
                        className="w-full py-3 px-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
                      >
                        Delete Property
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOOKING CONFIRMATION MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBookingModal(false)}
          ></div>
          
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${
                bookingAction === "approve" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"
              }`}>
                {bookingAction === "approve" ? "✅" : "❌"}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {bookingAction === "approve" ? "Approve Booking?" : "Reject Booking?"}
              </h3>
              <p className="text-gray-500 text-sm mb-2">
                {bookingAction === "approve" 
                  ? "This will mark the property as rented." 
                  : "This will decline the tenant's request."
                }
              </p>
              {selectedBooking && (
                <p className="text-sm text-gray-600 mb-6">
                  Tenant: <span className="font-semibold">{selectedBooking.tenant_name}</span><br/>
                  Property: <span className="font-semibold">{selectedBooking.title}</span>
                </p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBookingAction}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition shadow-lg ${
                    bookingAction === "approve"
                      ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                      : "bg-red-500 hover:bg-red-600 shadow-red-200"
                  }`}
                >
                  {bookingAction === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowDeleteModal(false)}
          ></div>
          
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