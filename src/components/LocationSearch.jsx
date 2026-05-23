import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

export default function LocationSearch({ onSelect, placeholder = "Search for a location..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const map = useMap();
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Using Nominatim (free OpenStreetMap geocoding)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}, Addis Ababa, Ethiopia&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    // Fly to location
    map.flyTo([lat, lng], 16);
    
    // Send coordinates to parent
    onSelect({
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      displayName: result.display_name
    });
    
    setQuery(result.display_name.split(",")[0]);
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-[#087474] focus:border-transparent outline-none transition-all placeholder:text-gray-400"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#087474] rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-none"
            >
              <p className="text-sm font-medium text-gray-800 line-clamp-1">
                {result.display_name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}