import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch from backend
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await api.getAllProperties();
        setProperties(data);
        setFilteredProperties(data);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Client-side filter (matches your existing UI)
  useEffect(() => {
    let result = properties;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title && p.title.toLowerCase().includes(term)) ||
          (p.city && p.city.toLowerCase().includes(term)) ||
          (p.district && p.district.toLowerCase().includes(term))
      );
    }

    if (priceRange) {
      result = result.filter((p) => p.price <= parseInt(priceRange));
    }

    if (bedrooms) {
      result = result.filter((p) => p.bedrooms >= parseInt(bedrooms));
    }

    setFilteredProperties(result);
  }, [searchTerm, priceRange, bedrooms, properties]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading properties...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Properties</h1>
          <p className="text-sm text-gray-500">{filteredProperties.length} homes available</p>
        </div>
      </div>

      {/* Filters - same UI */}
      <div className="sticky top-0 z-20 bg-white shadow-md py-4">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="🔍 Search by title or location..."
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#087474]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#087474]"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
          >
            <option value="">All Prices</option>
            <option value="20000">Up to 20k ETB</option>
            <option value="50000">Up to 50k ETB</option>
            <option value="100000">Up to 100k ETB</option>
          </select>
          <select
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#087474]"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          >
            <option value="">All Bedrooms</option>
            <option value="1">1 Bed</option>
            <option value="2">2 Bed</option>
            <option value="3">3 Bed</option>
            <option value="4">4+ Bed</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm("");
              setPriceRange("");
              setBedrooms("");
            }}
            className="border rounded-xl hover:bg-gray-100 transition"
          >
            Clear Filters ✖
          </button>
        </div>
      </div>

      {/* Grid - updated to use backend fields */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className="bg-[#0b3d3d] text-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition group border border-white/10"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={property.images?.[0]?.image_url || "https://picsum.photos/400/300"}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span className="absolute top-3 left-3 bg-[#087474] text-[10px] px-2 py-1 rounded-full">
                For Rent
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold line-clamp-1">{property.title}</h3>
              <p className="text-white/60 text-xs mt-1">
                📍 {property.city}, {property.district}
              </p>
              <div className="flex justify-between text-xs text-white/60 mt-2 border-b border-white/10 pb-2">
                <span>{property.bedrooms} Bed</span>
                <span>{property.bathrooms} Bath</span>
                <span>{property.size} m²</span>
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-lg font-bold text-white">
                  {property.price} ETB
                </span>
                <Link to={ `/properties/${property.property_id}` }>
                  <button className="bg-[#fbbf24] text-black px-3 py-1.5 rounded-md text-xs font-semibold hover:scale-105 transition">
                    View
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-20">
          <h3 className="text-xl font-bold text-gray-800">No properties found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}