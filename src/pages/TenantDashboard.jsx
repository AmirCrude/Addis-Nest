import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("date");

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.getMyBookings();
      // Filter out cancelled bookings
      const filtered = (response.data || []).filter(b => b.status !== 'cancelled');
      setBookings(filtered);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async () => {
    if (!bookingToCancel) return;
    try {
      await api.cancelBooking(bookingToCancel.booking_id);
      setNotification({ show: true, type: 'success', message: 'Booking cancelled' });
      setShowCancelModal(false);
      setBookingToCancel(null);
      fetchBookings();
    } catch (err) {
      alert(err.message || "Failed to cancel");
    }
  };

  const filteredBookings = useMemo(() => {
    let data = [...bookings];

    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter(b => b.title?.toLowerCase().includes(s) || b.district?.toLowerCase().includes(s));
    }

    if (statusFilter !== "all") {
      data = data.filter(b => b.status === statusFilter);
    }

    if (sort === "price-high") data.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === "price-low") data.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === "name") data.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return data;
  }, [bookings, search, statusFilter, sort]);

  const stats = useMemo(() => {
    const approved = bookings.filter(b => b.status === "approved");
    return {
      total: bookings.length,
      active: approved.length,
      pending: bookings.filter(b => b.status === "pending").length,
      totalSpent: approved.reduce((sum, b) => sum + parseFloat(b.price || 0), 0),
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
      {notification.show && (
        <div className="fixed top-24 right-4 z-[1200] animate-slide-in-right">
          <div className={`rounded-2xl shadow-2xl border max-w-md ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3 p-4 pr-12">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {notification.type === 'success' ? '✓' : '✗'}
              </div>
              <div>
                <h4 className={`font-bold text-sm mb-0.5 ${notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                <p className={`text-sm ${notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{notification.message}</p>
              </div>
              <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-black/10">✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCancelModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✕</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Cancel Request?</h3>
            <p className="text-gray-500 text-sm mb-6">Cancel your booking request for "{bookingToCancel?.title}"?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Keep</button>
              <button onClick={handleCancel} className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition shadow-lg">Cancel Request</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-[#0b3d3d] pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white">My Rentals</h1>
            <p className="text-white/60 mt-1">Welcome back, {user?.name || user?.email?.split('@')[0] || 'Tenant'}</p>
          </div>
          <Link to="/properties">
            <button className="bg-[#fbbf24] px-8 py-3 rounded-xl font-bold text-[#0b3d3d] hover:scale-105 transition shadow-lg">
              Browse Properties
            </button>
          </Link>
        </div>
      </div>

      {/* STATS - Only approved values */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat title="Total Requests" value={stats.total} icon="📋" />
        <Stat title="Active Rentals" value={stats.active} icon="🏠" color="text-green-600" />
        <Stat title="Pending" value={stats.pending} icon="⏳" color="text-yellow-600" />
        <Stat title="Monthly Rent" value={`${stats.totalSpent.toLocaleString()} ETB`} icon="💰" />
      </div>

      {/* FILTERS */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or district..."
              className="border rounded-xl px-3 py-2 text-sm outline-none"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-xl px-3 py-2 text-sm outline-none">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded-xl px-3 py-2 text-sm outline-none">
              <option value="date">Newest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* BOOKINGS LIST */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-500 text-lg mb-2">No rentals found</p>
            <Link to="/properties" className="text-[#087474] font-bold underline">Browse Available Properties</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.booking_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="md:flex">
                  <div className="md:w-72 h-48 relative overflow-hidden bg-gray-200">
                    <img
                      src={booking.image_url ? `http://localhost:5000${booking.image_url}` : `https://picsum.photos/seed/${booking.property_id}/400/300`}
                      alt={booking.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${booking.property_id}/400/300`; }}
                    />
                    <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full uppercase ${
                      booking.status === "approved" ? "bg-green-400 text-green-900" :
                      booking.status === "pending" ? "bg-yellow-400 text-yellow-900" :
                      booking.status === "rejected" ? "bg-red-400 text-red-900" : "bg-gray-400 text-gray-900"
                    }`}>{booking.status}</span>
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{booking.title}</h3>
                        <p className="text-gray-500 text-sm">
                          📍 <span className="font-bold text-[#fbbf24]">{booking.district}</span>, {booking.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-[#fbbf24]">{Number(booking.price).toLocaleString()}</span>
                        <span className="text-xs text-gray-400 block">ETB/month</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500 mt-3 pb-3 border-b border-gray-100">
                      {booking.bedrooms > 0 && <span>{booking.bedrooms} Beds</span>}
                      {booking.bathrooms > 0 && <span>{booking.bathrooms} Baths</span>}
                      {booking.size > 0 && <span>{booking.size} m²</span>}
                      {booking.floor_number > 0 && <span>{booking.floor_number} Floor</span>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => navigate(`/properties/${booking.property_id}`)} className="flex-1 bg-[#0b3d3d] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#087474] transition">View Details</button>
                      {booking.status === 'pending' && (
                        <button onClick={() => { setBookingToCancel(booking); setShowCancelModal(true); }} className="flex-1 border border-red-300 text-red-600 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition">Cancel</button>
                      )}
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

function Stat({ title, value, icon, color = "text-gray-800" }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex justify-between items-center">
      <div>
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{title}</p>
        <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  );
}