// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import bgImage from "../assets/home.png";
import Map from "../components/Map";
import PropertyCard from "../components/PropertyCard";
import api from "../utils/api";

export default function Home() {
  const navigate = useNavigate();
  // New States
  const [featuredTop, setFeaturedTop] = useState([]);
  const [latestProperties, setLatestProperties] = useState([]);
  const [featuredBottom, setFeaturedBottom] = useState([]);
  const [mapProperties, setMapProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [locations, setLocations] = useState([]);

  const [searchFilters, setSearchFilters] = useState({
    minPrice: "",
    maxPrice: "",
    location: ""
  });

  useEffect(() => {
    const fetchHomepageContent = async () => {
      try {
        setLoading(true);
        // Single optimized call to our new route
        const res = await api.getHomepageData();
        
        if (res.success) {
          setFeaturedTop(res.data.featuredTop || []);
          setLatestProperties(res.data.latest || []);
          setFeaturedBottom(res.data.featuredBottom || []);
          setMapProperties(res.data.latest || []); // Using latest for map for now

          setLocations(res.data.locations || []);
        }
      } catch (error) {
        console.error("Error loading home page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageContent();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchFilters.minPrice) params.append("min_price", searchFilters.minPrice);
    if (searchFilters.maxPrice) params.append("max_price", searchFilters.maxPrice);
    if (searchFilters.location) params.append("city", searchFilters.location);
    
    navigate(`/properties?${params.toString()}`);
  };


  return (
    <div className="bg-gray-50">

      {/* HERO SECTION - KEEP EXISTING */}
      <div className="bg-[#0b3d3d] text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-12">

          <div className="lg:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Find Your Perfect Home in Addis Ababa{" "}
              <span className="text-[#fbbf24]">Faster & Simpler</span>
            </h1>

            <p className="text-white/80 text-lg mb-10 max-w-lg">
              Discover verified apartments, studios, and family homes with real photos and direct landlord contact.
            </p>

            <Link to="/properties">
              <button className="bg-[#fbbf24] px-7 py-3 rounded-xl font-semibold hover:scale-105 transition shadow-lg">
                Explore Properties
              </button>
            </Link>
          </div>

          <div className="lg:w-1/2">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <img
                src={bgImage}
                alt="hero"
                className="w-full h-[420px] object-cover"
              />
            </div>
          </div>

        </div>
      </div>

      {/* UPDATED SEARCH BAR */}
      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
  <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-5 border">
    <div className="grid md:grid-cols-4 gap-3">
      
      {/* Min Price Field */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">Min Price (ETB)</label>
        <input
          type="number"
          placeholder="2,000"
          value={searchFilters.minPrice}
          onChange={(e) => setSearchFilters({...searchFilters, minPrice: e.target.value})}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#087474] outline-none transition"
        />
      </div>

      {/* Max Price Field */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">Max Price (ETB)</label>
        <input
          type="number"
          placeholder="20,000"
          value={searchFilters.maxPrice}
          onChange={(e) => setSearchFilters({...searchFilters, maxPrice: e.target.value})}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#087474] outline-none transition"
        />
      </div>

      {/* Dynamic Location Dropdown */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">Location</label>
        <select
          value={searchFilters.location}
          onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#087474] outline-none transition cursor-pointer"
        >
          <option value="">All Locations</option>
          {locations.length > 0 ? (
            locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))
          ) : (
            <option disabled>Loading locations...</option>
          )}
        </select>
      </div>

      {/* Submit Button */}
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full bg-[#087474] text-white rounded-lg font-semibold hover:bg-[#066565] transform active:scale-95 transition-all py-2.5 shadow-md"
        >
          Search Properties
        </button>
      </div>

    </div>
  </form>
</div>

      {/* FEATURED RENTALS (TOP) */}
<div className="max-w-7xl mx-auto px-6 py-16">
  <div className="flex justify-between items-center mb-8">
    <h2 className="text-2xl font-bold text-gray-800">Featured Rentals</h2>
    <Link to="/properties" className="text-[#087474] font-medium hover:underline">View all →</Link>
  </div>

  {loading ? (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#087474] mx-auto"></div>
    </div>
  ) : (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
      {featuredTop.length > 0 ? (
        featuredTop.map((property) => (
          <PropertyCard key={property.property_id} property={property} />
        ))
      ) : (
        <div className="col-span-full text-center text-gray-500 py-12">No featured properties found.</div>
      )}
    </div>
  )}
</div>

{/* LATEST LISTINGS */}
<div className="bg-white py-16">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-2xl font-bold text-gray-800">Latest Listings</h2>
      <Link to="/properties" className="text-[#087474] font-medium hover:underline">View all →</Link>
    </div>

    {!loading && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {latestProperties.map((property) => (
          <PropertyCard key={property.property_id} property={property} />
        ))}
      </div>
    )}
  </div>
</div>

      {/* ABOUT SECTION - KEEP EXISTING */}
      <div id="about" className="bg-white py-20 border-t">
        <div className="max-w-6xl mx-auto px-6 text-center">

          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            About AddisNest
          </h2>

          <p className="text-gray-600 max-w-2xl mx-auto mb-10">
            AddisNest helps people in Ethiopia find rental homes quickly and safely.
            We connect tenants directly with landlords through verified listings,
            real photos, and clear pricing.
          </p>

          <div className="grid md:grid-cols-3 gap-6 text-left">

            <div className="p-6 bg-gray-50 rounded-xl border">
              <h3 className="font-semibold mb-2">🔍 Easy Search</h3>
              <p className="text-sm text-gray-600">
                Find homes by location, price, and type in seconds.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl border">
              <h3 className="font-semibold mb-2">✔ Verified Listings</h3>
              <p className="text-sm text-gray-600">
                We focus on real, up-to-date rental properties only.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl border">
              <h3 className="font-semibold mb-2">📞 Direct Contact</h3>
              <p className="text-sm text-gray-600">
                Talk directly to landlords without middle delays.
              </p>
            </div>

          </div>
        </div>
      </div>

{/* MAP + FEATURED BOTTOM SECTION */}
<div className="max-w-7xl mx-auto px-6 pb-16 pt-16 border-t">
  <h2 className="text-2xl font-bold text-gray-800 mb-8">More Featured Options</h2>
  <div className="grid lg:grid-cols-2 gap-6 items-stretch">
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 auto-rows-fr">
      {/* Use the bottom featured group here */}
      {featuredBottom.map((property) => (
        <PropertyCard key={property.property_id} property={property} />
      ))}
    </div>

    <div className="bg-white p-4 rounded-2xl shadow-md border h-full min-h-[400px]">
      <Map properties={mapProperties} />
    </div>
  </div>
</div>

      {/* FOOTER - KEEP EXISTING */}
      <footer className="bg-[#0b3d3d] text-white py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">

          <div>
            <h2 className="text-xl font-bold mb-3">AddisNest</h2>
            <p className="text-sm text-white/70">
              Find trusted rental homes across Ethiopia.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Links</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/properties">Properties</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Contact</h3>
            <p className="text-sm text-white/70">
              Addis Ababa, Ethiopia
            </p>
          </div>

        </div>

        <div className="text-center text-white/50 text-sm mt-8">
          © {new Date().getFullYear()} AddisNest
        </div>
      </footer>

    </div>
  );
}