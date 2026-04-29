import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LandlordDashboard() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    totalValue: 0,
  });

  // 🔥 LOAD + AUTO REFRESH
  useEffect(() => {
    loadProperties();

    window.addEventListener("focus", loadProperties);
    return () => window.removeEventListener("focus", loadProperties);
  }, []);

  // 🔥 LOAD DATA
  const loadProperties = () => {
    const stored =
      JSON.parse(localStorage.getItem("properties")) || [];

    // Ensure safe defaults
    const safeData = stored.map((p) => ({
      ...p,
      status: p.status || "available",
    }));

    setProperties(safeData);
  };

  // 🔥 FILTER + STATS (reactive)
  useEffect(() => {
    let filtered = [...properties];

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.type === filterType);
    }

    setFilteredProperties(filtered);

    // stats
    const total = properties.length;
    const available = properties.filter(
      (p) => p.status !== "rented"
    ).length;
    const rented = properties.filter(
      (p) => p.status === "rented"
    ).length;

    const totalValue = properties.reduce(
      (sum, p) => sum + (p.price || 0),
      0
    );

    setStats({ total, available, rented, totalValue });
  }, [properties, searchTerm, filterType]);

  // 🔥 ACTIONS
  const deleteProperty = (id) => {
    if (!window.confirm("Delete this property?")) return;

    const updated = properties.filter((p) => p.id !== id);

    localStorage.setItem("properties", JSON.stringify(updated));
    setProperties(updated);
  };

  const togglePropertyStatus = (id) => {
    const updated = properties.map((p) =>
      p.id === id
        ? {
            ...p,
            status: p.status === "rented" ? "available" : "rented",
          }
        : p
    );

    localStorage.setItem("properties", JSON.stringify(updated));
    setProperties(updated);
  };

  const editProperty = (id) => {
    navigate(`/edit-property/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#0b3d3d]">

      {/* HEADER */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            🏠 Landlord Dashboard
          </h1>

          <button
            onClick={() => navigate("/add-property")}
            className="bg-[#fbbf24] px-6 py-2 rounded-lg font-semibold hover:bg-[#f59e0b]"
          >
            + Add Property
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-4 gap-6">
        <Stat title="Total" value={stats.total} icon="🏘️" />
        <Stat title="Available" value={stats.available} icon="✅" />
        <Stat title="Rented" value={stats.rented} icon="🔑" />
        <Stat
          title="Total Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          icon="💰"
        />
      </div>

      {/* FILTER */}
      <div className="max-w-7xl mx-auto px-4 mb-6 bg-white p-4 rounded-lg">
        <div className="flex gap-3 flex-wrap">
          <input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded flex-1"
          />

          {["all", "Apartment", "House", "Villa"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 rounded ${
                filterType === t
                  ? "bg-[#fbbf24]"
                  : "bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        {filteredProperties.length === 0 ? (
          <Empty navigate={navigate} />
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filteredProperties.map((p) => (
              <div
                key={p.id}
                className="bg-[#0b3d3d] rounded-xl overflow-hidden shadow"
              >
                <img
                  src={
                    p.image ||
                    "https://via.placeholder.com/400x300"
                  }
                  className="h-48 w-full object-cover"
                />

                <div className="p-4 text-white">
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-gray-300">
                    {p.location}
                  </p>

                  <p className="text-[#fbbf24] font-bold mt-2">
                    ${p.price}
                  </p>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() =>
                        togglePropertyStatus(p.id)
                      }
                      className="bg-blue-500 px-3 py-1 rounded"
                    >
                      Toggle
                    </button>

                    <button
                      onClick={() => editProperty(p.id)}
                      className="bg-yellow-500 px-3 py-1 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteProperty(p.id)}
                      className="bg-red-500 px-3 py-1 rounded"
                    >
                      Delete
                    </button>
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

// 🔥 SMALL COMPONENTS (cleaner)
function Stat({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow flex justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  );
}

function Empty({ navigate }) {
  return (
    <div className="bg-white p-10 text-center rounded">
      <h3>No properties yet</h3>
      <button
        onClick={() => navigate("/add-property")}
        className="mt-4 bg-[#fbbf24] px-4 py-2 rounded"
      >
        Add Property
      </button>
    </div>
  );
}