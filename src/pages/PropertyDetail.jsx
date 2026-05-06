import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showContactAlert, setShowContactAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // First, fetch property, amenities, and images in parallel
        const [propertyData, amenitiesData, imagesData] = await Promise.all([
          api.getPropertyById(id),
          api.getPropertyAmenities(id),
          api.getAllPropertyImages(id)
        ]);
    
        // Then fetch landlord info using the landlord_id from property data
        let landlordData = null;
        if (propertyData?.landlord_id) {
          try {
            const landlordResponse = await api.getUserById(propertyData.landlord_id);
            landlordData = landlordResponse;
          } catch (err) {
            console.error("Failed to fetch landlord info:", err);
          }
        }
    
        // Merge landlord data into property
        setProperty({
          ...propertyData,
          landlord_name: landlordData?.name || "Hello",
          landlord_email: landlordData?.email || "email this is",
          landlord_phone: landlordData?.phone_number || "phone this is"  
        });
        setAmenities(amenitiesData || []);
        setImages(imagesData || []);
    
      } catch (err) {
        console.error("Error fetching property detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id]);

  const handleContactLandlord = () => {
    setIsLoading(true);
    setTimeout(() => {
      setShowContactAlert(true);
      setIsLoading(false);
      setTimeout(() => setShowContactAlert(false), 3000);
    }, 800);
  };

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#087474] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <Link to="/properties" className="inline-block bg-[#087474] text-white px-6 py-3 rounded-lg hover:bg-[#066565] transition">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const displayImage = images.length > 0 
    ? images[currentImageIndex]?.image_url 
    : "https://picsum.photos/1200/800";

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Copied Toast */}
      {showCopiedToast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in text-sm">
          🔗 Link copied to clipboard!
        </div>
      )}

      {/* Hero Section with Image Slider */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
        <img
          src={displayImage}
          className="w-full h-full object-cover"
          alt={property.title}
          onError={(e) => {
            e.target.src = "https://picsum.photos/1200/800";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>

        {/* Back Button */}
        <Link
          to="/properties"
          className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition z-10"
          aria-label="Go back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        {/* Image Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-lg transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-lg transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-20 right-6 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm z-10">
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        )}

        <div className="absolute bottom-6 left-6 right-6 text-white">
          {/* Availability Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 inline-block ${
            property.availability_status === 'available' ? 'bg-green-500' : 'bg-orange-500'
          }`}>
            {property.availability_status}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{property.title}</h1>
          <p className="text-white/90 text-lg flex items-center gap-2">
            <span>📍</span> {property.city}, {property.district}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Column */}
        <div className="lg:w-2/3 space-y-6">  
        {/* Price & Quick Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-3xl font-bold text-[#087474] mb-4">
            {Number(property.price).toLocaleString()} ETB <span className="text-sm text-gray-400 font-normal">/ month</span>
          </h2>
          <div className="grid grid-cols-3 gap-4 border-t pt-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs">Bedrooms</p>
              <p className="font-bold">{property.bedrooms}</p>
            </div>
            <div className="text-center border-x">
              <p className="text-gray-400 text-xs">Bathrooms</p>
              <p className="font-bold">{property.bathrooms}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Area</p>
              <p className="font-bold">{property.size} m²</p>
            </div>
          </div>
        </div>
          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📝</span> Description
            </h3>
            <p className="text-gray-600 leading-relaxed">{property.description || "No description available."}</p>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>✨</span> What this place offers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {amenities.length > 0 ? (
                amenities.map((amt) => (
                  <div key={amt.amenity_id} className="flex items-center gap-3">
                    <span className="text-[#087474]">✓</span>
                    <span className="text-sm font-medium">{amt.amenity_name}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm italic col-span-full">No amenities listed.</p>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📋</span> Property Details
            </h3>
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

        {/* Right Sidebar */}
        <div className="lg:w-1/3">
          <div className="sticky top-28 space-y-6">
            {/* Landlord Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-[#0b3d3d]/10 rounded-lg flex items-center justify-center text-sm">👤</span>
                Listed by
              </h3>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#0b3d3d] to-[#087474] rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-lg">
                    {property.landlord_name?.charAt(0)?.toUpperCase() || 'L'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">{property.landlord_name || "Landlord"}</p>
                  <p className="text-xs text-gray-500">Verified Property Owner</p>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 mb-6 bg-gray-50 rounded-xl p-4">
                {property.landlord_email && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-lg">✉️</span>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Email</p>
                      <p className="text-gray-700 font-medium text-sm">{property.landlord_email}</p>
                    </div>
                  </div>
                )}
                {property.landlord_phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-lg">📞</span>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Phone</p>
                      <p className="text-gray-700 font-medium text-sm">{property.landlord_phone}</p>
                    </div>
                  </div>
                )}
                {!property.landlord_email && !property.landlord_phone && (
                  <p className="text-gray-400 text-sm text-center italic">No contact details provided</p>
                )}
              </div>

              <button
                onClick={handleContactLandlord}
                disabled={isLoading}
                className="w-full bg-[#0b3d3d] text-white py-3.5 rounded-xl font-bold hover:bg-[#087474] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0b3d3d]/20 hover:shadow-xl hover:shadow-[#0b3d3d]/30 active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    📅 Book Viewing
                  </span>
                )}
              </button>

              {showContactAlert && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
                  <p className="text-green-700 text-sm text-center font-medium">
                    ✅ Request sent! The landlord will contact you soon.
                  </p>
                </div>
              )}
            </div>

            {/* Share Button */}
            <button
              onClick={handleShareLink}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:border-[#fbbf24] hover:text-[#0b3d3d] transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md group"
            >
              <span className="group-hover:scale-110 transition-transform">🔗</span>
              Share this property
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}