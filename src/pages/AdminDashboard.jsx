import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [propFilter, setPropFilter] = useState("all");
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Redirect non-admin
  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const fetchStats = async () => {
    try {
      const res = await api.getAdminStats();
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchProperties = useCallback(async () => {
    try {
      const params = {};
      if (propFilter !== "all") params.status = propFilter;
      if (search) params.search = search;
      const res = await api.getAdminProperties(params);
      setProperties(res.data || []);
    } catch (err) { console.error(err); }
  }, [search, propFilter]);
  
  const fetchUsers = useCallback(async () => {
    try {
      const params = {};
      if (userFilter !== "all") params.role = userFilter;
      if (search) params.search = search;
      const res = await api.getAdminUsers(params);
      setUsers(res.data || []);
    } catch (err) { console.error(err); }
  }, [search, userFilter]);

  const fetchFlagged = async () => {
    try {
      const res = await api.getAdminFlagged();
      setFlagged(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    setLoading(true);
    fetchStats();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "properties") fetchProperties();
    if (activeTab === "flagged") fetchFlagged();
    setLoading(false);
  }, [activeTab, fetchUsers, fetchProperties]);

    useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "properties") fetchProperties();
    }, [activeTab, fetchUsers, fetchProperties]);

  const handleFlagProperty = async (propertyId, status) => {
    try {
      await api.updatePropertyStatus(propertyId, status);
      setNotification({ show: true, type: 'success', message: `Property ${status}` });
      fetchProperties();
      fetchFlagged();
    } catch (err) { alert(err.message); }
  };

  const handleBanUser = async (userId) => {
    try {
      await api.banUser(userId);
      setNotification({ show: true, type: 'success', message: 'User banned' });
      fetchUsers();
    } catch (err) { alert(err.message); }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "properties", label: "Properties", icon: "🏘️" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "flagged", label: "Flagged", icon: "🚩" },
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#0b3d3d] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-24 right-4 z-[1200] animate-slide-in-right">
          <div className={`rounded-2xl shadow-2xl border max-w-md ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3 p-4 pr-12">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {notification.type === 'success' ? '✓' : '✗'}
              </div>
              <div>
                <h4 className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
                <p className="text-sm">{notification.message}</p>
              </div>
              <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-black/10">✕</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#0b3d3d] to-[#1a1a2e] pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">Admin Console</h1>
          <p className="text-white/60 mt-1">Platform management and oversight</p>
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-7xl mx-auto px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.id ? "bg-[#0b3d3d] text-[#fbbf24]" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.icon} {tab.label}
              {tab.id === "flagged" && flagged.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{flagged.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Properties" value={stats.totalProperties} color="bg-blue-500" />
              <StatCard title="Total Users" value={stats.totalUsers} color="bg-green-500" />
              <StatCard title="Flagged" value={stats.flaggedProperties} color="bg-red-500" />
              <StatCard title="Monthly Revenue" value={`${Number(stats.monthlyRevenue).toLocaleString()} ETB`} color="bg-[#fbbf24] text-black" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button onClick={() => setActiveTab("properties")} className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm">View All Properties</button>
                  <button onClick={() => setActiveTab("users")} className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm">Manage Users</button>
                  <button onClick={() => setActiveTab("flagged")} className="w-full text-left px-4 py-2 bg-red-50 rounded-lg hover:bg-red-100 text-sm text-red-600">Review Flagged ({stats.flaggedProperties})</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROPERTIES TAB */}
        {activeTab === "properties" && (
          <div>
            <div className="flex gap-3 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search properties..."
                className="border rounded-xl px-4 py-2 text-sm flex-1 outline-none"
              />
              <select value={propFilter} onChange={(e) => setPropFilter(e.target.value)} className="border rounded-xl px-4 py-2 text-sm outline-none">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="flagged">Flagged</option>
                <option value="removed">Removed</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">ID</th>
                      <th className="text-left px-4 py-3 font-semibold">Title</th>
                      <th className="text-left px-4 py-3 font-semibold">Owner</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map(p => (
                      <tr key={p.property_id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">#{p.property_id}</td>
                        <td className="px-4 py-3 font-medium">{p.title}</td>
                        <td className="px-4 py-3 text-gray-500">{p.landlord_name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                            p.status === 'active' ? 'bg-green-100 text-green-700' :
                            p.status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleFlagProperty(p.property_id, p.status === 'flagged' ? 'active' : 'flagged')} className={`text-xs px-2 py-1 rounded ${p.status === 'flagged' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {p.status === 'flagged' ? 'Unflag' : 'Flag'}
                            </button>
                            <button onClick={() => handleFlagProperty(p.property_id, 'removed')} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div>
            <div className="flex gap-3 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="border rounded-xl px-4 py-2 text-sm flex-1 outline-none"
              />
              <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="border rounded-xl px-4 py-2 text-sm outline-none">
                <option value="all">All Roles</option>
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">ID</th>
                      <th className="text-left px-4 py-3 font-semibold">Name</th>
                      <th className="text-left px-4 py-3 font-semibold">Email</th>
                      <th className="text-left px-4 py-3 font-semibold">Role</th>
                      <th className="text-left px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.user_id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">#{u.user_id}</td>
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'landlord' ? 'bg-blue-100 text-blue-700' :
                            u.role === 'banned' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          {u.role !== 'admin' && (
                            <button onClick={() => handleBanUser(u.user_id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-600">
                              {u.role === 'banned' ? 'Unban' : 'Ban'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FLAGGED TAB */}
        {activeTab === "flagged" && (
          <div className="grid gap-4">
            {flagged.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border">
                <p className="text-gray-500">No flagged properties</p>
              </div>
            ) : flagged.map(p => (
              <div key={p.property_id} className="bg-white rounded-2xl p-6 shadow-sm border flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{p.title}</h3>
                  <p className="text-sm text-gray-500">By: {p.landlord_name}</p>
                  {p.fraud_score && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Fraud Score:</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div className={`h-2 rounded-full ${p.fraud_score > 0.7 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${p.fraud_score * 100}%` }}></div>
                      </div>
                      <span className="text-xs font-bold">{(p.fraud_score * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {p.reason && <p className="text-xs text-red-500 mt-1">Reason: {p.reason}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleFlagProperty(p.property_id, 'active')} className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600">Keep</button>
                  <button onClick={() => handleFlagProperty(p.property_id, 'removed')} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className={`${color} rounded-2xl p-6 shadow-lg text-white`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}