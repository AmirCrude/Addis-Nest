import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactAlert, setShowContactAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await api.getPropertyById(id);
        setProperty(data);
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, navigate]);

  const handleContactLandlord = () => {
    setIsLoading(true);
    setTimeout(() => {
      setShowContactAlert(true);
      setIsLoading(false);
      setTimeout(() => setShowContactAlert(false), 3000);
    }, 800);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Property Not Found</h1>
          <Link to="/properties" className="inline-block bg-[#087474] text-white px-6 py-3 rounded-lg hover:bg-[#066565]">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section - same as before but with real data */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
        <img
          src={property.images?.[0]?.image_url || "https://picsum.photos/1200/800"}
          className="w-full h-full object-cover"
          alt={property.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
        <Link to="/properties" className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition z-10">
          ←
        </Link>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{property.title}</h1>
          <p className="text-white/90 text-lg flex items-center gap-2">
            📍 {property.city}, {property.district}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Column - simplified to available DB fields */}
        <div className="lg:w-2/3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <h2 className="text-3xl md:text-4xl font-bold text-[#087474]">
                  {property.price.toLocaleString()} ETB
                </h2>
              </div>
              <div className="flex gap-4 text-gray-600">
                <div className="text-center">
                  <span className="text-xl">🛏️</span>
                  <p className="text-sm font-medium mt-1">{property.bedrooms} Beds</p>
                </div>
                <div className="text-center">
                  <span className="text-xl">🚿</span>
                  <p className="text-sm font-medium mt-1">{property.bathrooms} Baths</p>
                </div>
                <div className="text-center">
                  <span className="text-xl">📐</span>
                  <p className="text-sm font-medium mt-1">{property.size} m²</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-semibold mb-4">📝 Description</h3>
            <p className="text-gray-600 leading-relaxed">{property.description || "No description available yet."}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-semibold mb-4">📋 Property Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-600">
                <span className="text-xl">🏠</span>
                <div>
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="text-sm font-medium">{property.property_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <span className="text-xl">📍</span>
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-sm font-medium">{property.city}, {property.district}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - contact card (booking will replace this later) */}
        <div className="lg:w-1/3">
          <div className="sticky top-28 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <button
                onClick={handleContactLandlord}
                disabled={isLoading}
                className="w-full bg-[#087474] text-white py-3 rounded-xl font-semibold hover:bg-[#066565] disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Contact Landlord / Request Booking"}
              </button>
              {showContactAlert && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  ✅ Request sent! (Booking module coming next)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}