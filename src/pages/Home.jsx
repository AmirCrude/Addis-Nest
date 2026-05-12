// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import bgImage from "../assets/home.png";
import Map from "../components/Map";
import PropertyCard from "../components/PropertyCard";
import api from "../utils/api";

export default function Home() {
  const navigate = useNavigate();
  const [latestProperties, setLatestProperties] = useState([]);
  const [mapProperties, setMapProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);

  const [searchFilters, setSearchFilters] = useState({
    minPrice: "",
    maxPrice: "",
    location: "",
    propertyType: ""
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        const [homepageRes, allPropertiesRes] = await Promise.all([
          api.getHomepageData(),
          api.getAllPropertiesMap()
        ]);

        if (homepageRes.success) {
          setLatestProperties(homepageRes.data.latest || []);
        }

        if (allPropertiesRes.success) {
          const allProps = allPropertiesRes.data.data || allPropertiesRes.data || [];
          setMapProperties(allProps);
          
          // 1. Map through the array to get just the districts
          // 2. Filter out any null/undefined values
          // 3. Use Set to get only UNIQUE district names
          const uniqueDistricts = [...new Set(allProps.map(prop => prop.district).filter(Boolean))];
        
          setLocations(uniqueDistricts);
        }
        

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchFilters.minPrice) params.append("min_price", searchFilters.minPrice);
    if (searchFilters.maxPrice) params.append("max_price", searchFilters.maxPrice);
    if (searchFilters.location) params.append("district", searchFilters.location);
    if (searchFilters.propertyType) params.append("property_type", searchFilters.propertyType);
    
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="bg-gray-50">

      {/* HERO SECTION - FULL VH WITH IMAGE */}
      <div className="bg-[#0b3d3d] text-white min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Left: Text + Search */}
            <div className="lg:w-2/3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Find Your Perfect Home in Addis Ababa{" "}
                <span className="text-[#fbbf24]">Faster & Simpler</span>
              </h1>

              <p className="text-white/80 text-lg mb-10 max-w-xl">
                Discover verified apartments, studios, and family homes with real photos and direct landlord contact.
              </p>
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <div className="grid md:grid-cols-5 gap-3">
                  
                  {/* Min Price Field */}
                  <div>
                    <label className="text-xs text-white/70 mb-1 block font-medium">Min Price (ETB)</label>
                    <input
                      type="number"
                      placeholder="2,000"
                      value={searchFilters.minPrice}
                      onChange={(e) => setSearchFilters({...searchFilters, minPrice: e.target.value})}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-[#fbbf24] outline-none transition"
                    />
                  </div>

                  {/* Max Price Field */}
                  <div>
                    <label className="text-xs text-white/70 mb-1 block font-medium">Max Price (ETB)</label>
                    <input
                      type="number"
                      placeholder="20,000"
                      value={searchFilters.maxPrice}
                      onChange={(e) => setSearchFilters({...searchFilters, maxPrice: e.target.value})}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-[#fbbf24] outline-none transition"
                    />
                  </div>

                  {/* Dynamic Location Dropdown */}
                  <div>
                    <label className="text-xs text-white/70 mb-1 block font-medium">Sub City</label>
                    <select
                      value={searchFilters.location}
                      onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#fbbf24] outline-none transition cursor-pointer"
                    >
                      <option value="" className="text-gray-800">All Sub Cities</option>
                      {locations.length > 0 ? (
                        locations.map((loc) => (
                          <option key={loc} value={loc} className="text-gray-800">
                            {loc}
                          </option>
                        ))
                      ) : (
                        <option disabled className="text-gray-800">Loading locations...</option>
                      )}
                    </select>
                  </div>

                  {/* Property Type Dropdown */}
                  <div>
                    <label className="text-xs text-white/70 mb-1 block font-medium">Type</label>
                    <select
                      value={searchFilters.propertyType}
                      onChange={(e) => setSearchFilters({...searchFilters, propertyType: e.target.value})}
                      className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#fbbf24] outline-none transition cursor-pointer"
                    >
                      <option value="" className="text-gray-800">All Types</option>
                      <option value="apartment" className="text-gray-800">Apartment</option>
                      <option value="villa" className="text-gray-800">Villa</option>
                      <option value="house" className="text-gray-800">House</option>
                      <option value="studio" className="text-gray-800">Studio</option>
                      <option value="commercial" className="text-gray-800">Commercial</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-[#fbbf24] text-[#0b3d3d] rounded-lg font-bold hover:bg-[#f59e0b] transform active:scale-95 transition-all py-2.5 shadow-lg"
                    >
                      Search
                    </button>
                  </div>

                </div>
              </form>
            </div>

            {/* Right: Image */}
            <div className="lg:w-1/3">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20">
                <img
                  src={bgImage}
                  alt="Modern home in Addis Ababa"
                  className="w-full h-[400px] lg:h-[500px] object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MAP SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              Explore Properties by Location
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Click on markers to view property details
            </p>
          </div>
          <div className="p-4">
            <div className="h-[500px] rounded-xl overflow-hidden">
              <Map properties={mapProperties} />
            </div>
          </div>
        </div>
      </div>

      {/* LATEST LISTINGS */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Latest Listings</h2>
              <p className="text-sm text-gray-500 mt-1">Recently added properties for rent</p>
            </div>
            <Link to="/properties" className="text-[#087474] font-medium hover:underline flex items-center gap-1">
              View all <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#087474] mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading properties...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestProperties.length > 0 ? (
                latestProperties.map((property) => (
                  <PropertyCard key={property.property_id} property={property} />
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-12">
                  <span className="text-4xl block mb-3">🏠</span>
                  No properties available yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ABOUT SECTION */}
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

            <div className="p-6 bg-gray-50 rounded-xl border hover:shadow-md transition">
              <h3 className="font-semibold mb-2">Easy Search</h3>
              <p className="text-sm text-gray-600">
                Find homes by location, price, and type in seconds.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl border hover:shadow-md transition">
              <h3 className="font-semibold mb-2">Verified Listings</h3>
              <p className="text-sm text-gray-600">
                We focus on real, up-to-date rental properties only.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-xl border hover:shadow-md transition">
              <h3 className="font-semibold mb-2">Direct Contact</h3>
              <p className="text-sm text-gray-600">
                Talk directly to landlords without middle delays.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER */}
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
              <li><Link to="/" className="hover:text-[#fbbf24] transition">Home</Link></li>
              <li><Link to="/properties" className="hover:text-[#fbbf24] transition">Properties</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/login" className="hover:text-[#fbbf24] transition">Login</Link></li>
              <li><Link to="/register" className="hover:text-[#fbbf24] transition">Register</Link></li>
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