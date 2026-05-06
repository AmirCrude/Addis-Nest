import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    show: false,
    type: '',
    message: ''
  });

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("date");

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Load tenant's bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.getMyBookings(); // You'll need to create this API endpoint
        const data = response.data || response;
        setBookings(data);
      } catch (err) {
        console.error("Failed to load bookings:", err);
        setNotification({
          show: true,
          type: 'error',
          message: 'Failed to load your rentals'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Filtered & sorted bookings
  const filteredBookings = useMemo(() => {
    let data = [...bookings];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      data = data.filter(
        (booking) =>
          booking.title?.toLowerCase().includes(searchLower) ||
          booking.city?.toLowerCase().includes(searchLower) ||
          booking.district?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      data = data.filter((booking) => booking.status === statusFilter);
    }

    // Sort
    if (sort === "price-high") {
      data.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === "price-low") {
      data.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "name") {
      data.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      // Default: newest first
      data.sort((a, b) => new Date(b.booking_date || 0) - new Date(a.booking_date || 0));
    }

    return data;
  }, [bookings, search, statusFilter, sort]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      active: bookings.filter((b) => b.status === "active" || b.status === "approved").length,
      pending: bookings.filter((b) => b.status === "pending").length,
      totalSpent: bookings.reduce((sum, b) => sum + parseFloat(b.price || 0), 0),
    };
  }, [bookings]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b3d3d]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your rentals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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

      {/* HEADER SECTION */}
      <div className="bg-[#0b3d3d] pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white">My Rentals</h1>
            <p className="text-white/60 mt-1">
              Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'Tenant'} 👋
            </p>
          </div>
          <Link to="/properties">
            <button className="bg-[#fbbf24] px-8 py-3 rounded-xl font-bold text-[#0b3d3d] hover:scale-105 transition shadow-lg">
              🔍 Browse Properties
            </button>
          </Link>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat title="Total Bookings" value={stats.total} icon="📋" />
        <Stat title="Active Rentals" value={stats.active} icon="🏠" color="text-green-600" />
        <Stat title="Pending" value={stats.pending} icon="⏳" color="text-yellow-600" />
        <Stat title="Total Spent" value={`${stats.totalSpent.toLocaleString()} ETB`} icon="💰" />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
              <span className="text-gray-400">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or location..."
                className="flex-1 bg-transparent outline-none text-gray-700 text-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option value="all">📊 All Statuses</option>
              <option value="active">✅ Active</option>
              <option value="approved">✅ Approved</option>
              <option value="pending">⏳ Pending</option>
              <option value="completed">📅 Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option value="date">📅 Newest First</option>
              <option value="price-high">💰 Price: High to Low</option>
              <option value="price-low">💰 Price: Low to High</option>
              <option value="name">📝 Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* BOOKINGS LIST */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">🏠</div>
            <p className="text-gray-500 text-lg mb-2">No rentals found</p>
            <p className="text-gray-400 text-sm mb-6">
              {search || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start browsing properties to find your next home'}
            </p>
            <Link 
              to="/properties" 
              className="text-[#087474] font-bold underline hover:text-[#0b3d3d] transition"
            >
              Browse Available Properties
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.booking_id || booking.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="md:flex">
                  {/* IMAGE */}
                  <div className="md:w-72 h-48 md:h-auto relative overflow-hidden bg-gray-200">
                    <img
                      src={booking.image_url || booking.mainImage || "https://via.placeholder.com/400x300?text=No+Image"}
                      alt={booking.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                    
                    {/* Status Badge */}
                    <span
                      className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        booking.status === "active" || booking.status === "approved"
                          ? "bg-green-400 text-green-900"
                          : booking.status === "pending"
                          ? "bg-yellow-400 text-yellow-900"
                          : booking.status === "completed"
                          ? "bg-blue-400 text-blue-900"
                          : "bg-red-400 text-red-900"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {/* CONTENT */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#0b3d3d] transition">
                          {booking.title}
                        </h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                          📍 {booking.city}, {booking.district}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-[#fbbf24]">
                          {Number(booking.price).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 block">ETB/month</span>
                      </div>
                    </div>

                    {/* DETAILS ROW */}
                    <div className="flex gap-4 text-sm text-gray-500 mt-3 pb-3 border-b border-gray-100">
                      <span className="flex items-center gap-1">🛏️ {booking.bedrooms} Beds</span>
                      <span className="flex items-center gap-1">🚿 {booking.bathrooms} Baths</span>
                      <span className="flex items-center gap-1">📐 {booking.size || booking.area} m²</span>
                      <span className="flex items-center gap-1">📅 {new Date(booking.booking_date).toLocaleDateString()}</span>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2 mt-auto pt-3">
                      <button
                        onClick={() => navigate(`/property/${booking.property_id}`)}
                        className="flex-1 bg-[#0b3d3d] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#087474] transition"
                      >
                        View Details
                      </button>
                      
                      <button
                        onClick={() => {
                          window.location.href = `mailto:${booking.landlord_email || 'support@rental.com'}?subject=Regarding ${booking.title}`;
                        }}
                        className="flex-1 border border-gray-300 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                      >
                        Contact Landlord
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- STAT COMPONENT ---------------- */
function Stat({ title, value, icon, color = "text-gray-800" }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex justify-between items-center hover:shadow-2xl transition">
      <div>
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{title}</p>
        <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
      </div>
      <span className="text-3xl bg-gray-50 p-2 rounded-xl">{icon}</span>
    </div>
  );
}