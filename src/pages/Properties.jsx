import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom"; 
import api from "../utils/api";

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  
  
  // 1. Pagination State
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);
  const itemsPerPage = 12;
  const [totalPages, setTotalPages] = useState(1);

  // Sync state with URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [bedrooms, setBedrooms] = useState(searchParams.get("min_bedrooms") || "");
  
  const [loading, setLoading] = useState(true);

  // Fetch from backend
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const filters = {
          ...Object.fromEntries([...searchParams]),
          page: currentPage,
          limit: itemsPerPage
        };
        const res = await api.getProperties(filters);
        
        // Update: res now contains { data, totalPages, totalItems }
        setProperties(res.data.data || []);
        setFilteredProperties(res.data.data || []);
        setTotalPages(res.data.totalPages || 1); // Set total pages from backend
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [searchParams, currentPage]);

  // Client-side filter
  useEffect(() => {
    let result = properties;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          p.city?.toLowerCase().includes(term) ||
          p.district?.toLowerCase().includes(term)
      );
    }

    if (maxPrice) {
      result = result.filter((p) => p.price <= parseInt(maxPrice));
    }

    if (minPrice) {
      result = result.filter((p) => p.price >= parseInt(minPrice));
    }

    if (bedrooms) {
      result = result.filter((p) => p.bedrooms >= parseInt(bedrooms));
    }

    setFilteredProperties(result);
  }, [searchTerm, maxPrice, minPrice, bedrooms, properties]);

  const clearFilters = () => {
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setCurrentPage(1);
    setSearchParams({}); 
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Generates an array like [1, '...', 10, 11, 12, 13, 14, '...', 50]
  const getPageNumbers = () => {
    const pages = [];
    const step = 2; // Number of pages to show around current page
  
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - step && i <= currentPage + step)
      ) {
        pages.push(i);
      } else if (i === currentPage - step - 1 || i === currentPage + step + 1) {
        pages.push("...");
      }
    }
    return [...new Set(pages)];
  };
  

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading properties...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Properties</h1>
        <p className="text-sm text-gray-500">{filteredProperties.length} homes available on this page</p>
      </div>

      {/* Sticky Filters */}
      <div className="sticky top-0 z-20 bg-white shadow-md py-4 border-b">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="🔍 Search title or city..."
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#087474] outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#087474] outline-none"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          >
            <option value="">Any Price</option>
            <option value="10000">Up to 10k ETB</option>
            <option value="25000">Up to 25k ETB</option>
            <option value="50000">Up to 50k ETB</option>
            <option value="100000">Up to 100k ETB</option>
          </select>
          <select
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#087474] outline-none"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          >
            <option value="">Any Bedrooms</option>
            <option value="1">1+ Bed</option>
            <option value="2">2+ Bed</option>
            <option value="3">3+ Bed</option>
          </select>
          <button
            onClick={clearFilters}
            className="border rounded-xl hover:bg-gray-100 transition font-medium"
          >
            Clear ✖
          </button>
        </div>
      </div>

      {/* Grid - with forced layout for better scroll performance */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 [transform:translateZ(0)]">
        {filteredProperties.map((property) => (
          <div
            key={property.property_id}
            className="bg-[#0b3d3d] text-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group border border-white/10"
          >
            <div className="relative h-48 overflow-hidden bg-gray-800">
              <img
                src="https://placeholder.com"
                alt={property.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <span className="absolute top-3 right-3 bg-[#fbbf24] text-black text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                {property.availability_status}
              </span>
              {property.featured === 1 && (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                  FEATURED
                </span>
              )}
            </div>

            <div className="p-5">
              <h3 className="text-md font-bold line-clamp-1 group-hover:text-[#fbbf24] transition">{property.title}</h3>
              <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                📍 {property.city}, {property.district}
              </p>
              
              <div className="flex justify-between text-[11px] text-white/50 mt-4 border-y border-white/10 py-3">
                <span className="flex flex-col items-center"><b>{property.bedrooms}</b> Beds</span>
                <span className="flex flex-col items-center"><b>{property.bathrooms}</b> Baths</span>
                <span className="flex flex-col items-center"><b>{property.size}</b> m²</span>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase">Monthly Rent</span>
                  <span className="text-xl font-black text-[#fbbf24]">
                    {Number(property.price).toLocaleString()} <small className="text-[10px]">ETB</small>
                  </span>
                </div>
                <Link to={`/properties/${property.property_id}`}>
                  <button className="bg-[#fbbf24] text-black px-3 py-1.5 rounded-md text-xs font-semibold hover:scale-105 transition">
                    View
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
{/* 3. ENHANCED PROFESSIONAL PAGINATION UI */}
{totalPages > 1 && (
  <div className="flex flex-col items-center justify-center gap-6 py-16 border-t bg-gray-50/50">
    <div className="flex items-center gap-1 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
      
      {/* Left Arrow */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-[#0b3d3d]"
      >
        <svg xmlns="http://w3.org" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dynamic Page Numbers with Dots */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          page === "..." ? (
            <span key={`dots-${index}`} className="w-8 text-center text-gray-400 font-bold leading-loose">. . .</span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200 ${
                currentPage === page
                  ? "bg-[#0b3d3d] text-[#fbbf24] shadow-lg ring-2 ring-[#0b3d3d]/10"
                  : "text-gray-500 hover:bg-gray-100 hover:text-[#0b3d3d]"
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-[#0b3d3d]"
      >
        <svg xmlns="http://w3.org" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>

    {/* Status Text */}
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
      Page <span className="text-[#0b3d3d]">{currentPage}</span> of <span className="text-[#0b3d3d]">{totalPages}</span>
    </p>
  </div>
)}


      {filteredProperties.length === 0 && !loading && (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-xl font-bold text-gray-800">No properties found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters or go back to the first page.</p>
          <button onClick={clearFilters} className="mt-6 text-[#087474] font-semibold underline">Show all properties</button>
        </div>
      )}
    </div>
  );
}
