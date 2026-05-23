import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showContactAlert, setShowContactAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [existingBooking, setExistingBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const { user } = useAuth();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [propertyData, amenitiesData, imagesData] = await Promise.all([
          api.getPropertyById(id),
          api.getPropertyAmenities(id),
          api.getAllPropertyImages(id)
        ]);
    
        let landlordData = null;
        if (propertyData?.landlord_id) {
          try {
            const landlordResponse = await api.getUserById(propertyData.landlord_id);
            landlordData = landlordResponse;
          } catch (err) {
            console.error("Failed to fetch landlord info:", err);
          }
        }
    
        setProperty({
          ...propertyData,
          landlord_name: landlordData?.name || "Hello",
          landlord_email: landlordData?.email || "this is email",
          landlord_phone: landlordData?.phone_number || "this is phone number"  
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

  useEffect(() => {
    const checkExistingBooking = async () => {
      if (!user || user.role !== 'tenant') return;
      try {
        const res = await api.getMyBookings();
        const bookings = res.data || [];
        const existing = bookings.find(b => b.property_id === parseInt(id));
        setExistingBooking(existing || null);
      } catch (err) {
        // ignore
      }
    };
    if (id && user) checkExistingBooking();
  }, [id, user]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const handleContactLandlord = async () => {
    if (!user) {
      navigate(`/login?redirect=/properties/${id}`);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.createBooking(id);
      setShowContactAlert(true);
      setTimeout(() => setShowContactAlert(false), 3000);
      
      // Immediately set existing booking so button changes to "Cancel Request"
      setExistingBooking({
        booking_id: response.data?.booking_id,
        property_id: parseInt(id),
        status: 'pending'
      });
    } catch (err) {
      alert(err.message || "Failed to send booking request");
    } finally {
      setIsLoading(false);
    }
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

  const handleBack = () => {
    navigate(-1);
  };
  
  const handleCancelBooking = async () => {
    if (!existingBooking) return;
    try {
      await api.cancelBooking(existingBooking.booking_id);
      setExistingBooking(null);
      setShowCancelModal(false);
      setNotification({ show: true, type: 'success', message: 'Booking cancelled' });
    } catch (err) {
      alert(err.message || "Failed to cancel booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#087474] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-20">
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
  ? `http://localhost:5000${images[currentImageIndex]?.image_url}` 
  : "https://picsum.photos/1200/800";
  return (
    <div className="bg-gray-50 min-h-screen pt-20">
      {/* Copied Toast */}
      {showCopiedToast && (
        <div className="fixed top-24 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in text-sm">
          🔗 Link copied to clipboard!
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
          <div className={`rounded-2xl shadow-2xl border max-w-md ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3 p-4 pr-12">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {notification.type === 'success' ? '✓' : '✗'}
              </div>
              <div>
                <h4 className={`font-bold text-sm mb-0.5 ${notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
                  {notification.type === 'success' ? 'Success' : 'Error'}
                </h4>
                <p className={`text-sm ${notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{notification.message}</p>
              </div>
              <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-black/10">✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <button 
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl z-10"
          >
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full text-white transition z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full text-white transition z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <img
            src={displayImage}
            alt={property.title}
            className="max-h-[90vh] max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}

      {/* Main Content - Two Column Layout (Info on Left, Image on Right) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#087474] transition group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium text-sm">Back to previous page</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column - All Information (60%) */}
          <div className="lg:w-[60%] space-y-6">
            
            {/* Title & Location */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  property.availability_status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {property.availability_status}
                </span>
                <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                  {property.property_type}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{property.title}</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <span>📍</span> {property.city}, {property.district}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 text-center border hover:shadow-md transition">
                <p className="text-xl md:text-2xl font-bold text-[#087474]">{Number(property.price).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">ETB/month</p>
              </div>
              {property.bedrooms > 0 && (
                <div className="bg-white rounded-xl p-4 text-center border hover:shadow-md transition">
                  <p className="text-xl md:text-2xl font-bold text-gray-800">{property.bedrooms}</p>
                  <p className="text-xs text-gray-500 mt-1">Bedrooms</p>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="bg-white rounded-xl p-4 text-center border hover:shadow-md transition">
                  <p className="text-xl md:text-2xl font-bold text-gray-800">{property.bathrooms}</p>
                  <p className="text-xs text-gray-500 mt-1">Bathrooms</p>
                </div>
              )}
              {property.size > 0 && (
                <div className="bg-white rounded-xl p-4 text-center border hover:shadow-md transition">
                  <p className="text-xl md:text-2xl font-bold text-gray-800">{property.size}</p>
                  <p className="text-xs text-gray-500 mt-1">m²</p>
                </div>
              )}
              {property.floor_number > 0 && (
                <div className="bg-white rounded-xl p-4 text-center border hover:shadow-md transition">
                  <p className="text-xl md:text-2xl font-bold text-gray-800">{property.floor_number}</p>
                  <p className="text-xs text-gray-500 mt-1">Floor</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-lg font-semibold mb-3">📝 Description</h3>
              <p className="text-gray-600 leading-relaxed">{property.description || "No description available."}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-lg font-semibold mb-4">✨ Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.length > 0 ? (
                  amenities.map((amt) => (
                    <div key={amt.amenity_id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-[#087474] text-sm">✓</span>
                      <span className="text-sm font-medium">{amt.amenity_name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm italic col-span-full">No amenities listed.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Image & Landlord (40%) */}
          <div className="lg:w-[40%]">
            <div className="sticky top-24 space-y-6">
              
              {/* Image Gallery - Compact */}
              <div className="relative group cursor-pointer" onClick={() => setShowImageModal(true)}>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200 shadow-lg">
                <img
                  src={`http://localhost:5000${images[currentImageIndex]?.image_url}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={property.title}  
                  onError={(e) => {
                    e.target.src = "https://picsum.photos/1200/800";
                  }}
                />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium">
                      Click to view photos
                    </span>
                  </div>
                </div>
                
                {/* Share Button Overlay */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleShareLink(); }}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg transition"
                  title="Share"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>

                {images.length > 1 && (
                  <>
                    {/* Navigation Arrows */}
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition ${
                        index === currentImageIndex ? 'border-[#087474] ring-1 ring-[#087474]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={`http://localhost:5000${img.image_url}`} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    </button>
                  ))}
                </div>
              )}
              {/* Landlord Card */}
              <div className="bg-white rounded-2xl shadow-lg border p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>👤</span> Listed by
                </h3>
                
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0b3d3d] to-[#087474] rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg">
                    {property.landlord_name?.charAt(0)?.toUpperCase() || 'L'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{property.landlord_name || "Landlord"}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="text-green-500">✓</span> Verified Owner
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-5 bg-gray-50 rounded-xl p-4">
                  {property.landlord_email && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">✉️</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase">Email</p>
                        <p className="text-gray-700 font-medium text-sm truncate">{property.landlord_email}</p>
                      </div>
                    </div>
                  )}
                  {property.landlord_phone && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📞</span>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Phone</p>
                        <p className="text-gray-700 font-medium text-sm">{property.landlord_phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {existingBooking?.status === 'pending' ? (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full bg-red-500 text-white py-3.5 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg"
                  >
                    Cancel Request
                  </button>
                ) : existingBooking?.status === 'approved' || existingBooking?.status === 'rejected' ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-3.5 rounded-xl font-bold cursor-not-allowed"
                  >
                    {existingBooking.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </button>
                ) : (
                  <button
                    onClick={handleContactLandlord}
                    disabled={isLoading}
                    className="w-full bg-[#0b3d3d] text-white py-3.5 rounded-xl font-bold hover:bg-[#087474] transition-all disabled:opacity-50 shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    {isLoading ? 'Sending...' : '📅 Book Viewing'}
                  </button>
                )}
                {showContactAlert && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
                    <p className="text-green-700 text-sm text-center font-medium">
                      ✅ Request sent! The landlord will contact you soon.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {showCancelModal && (
              <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCancelModal(false)}></div>
                <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✕</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Cancel Request?</h3>
                  <p className="text-gray-500 text-sm mb-6">Are you sure you want to cancel your booking request for this property?</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowCancelModal(false)} className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Keep</button>
                    <button onClick={handleCancelBooking} className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition shadow-lg">Cancel Request</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}