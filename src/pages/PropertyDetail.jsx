import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

export default function PropertyDetail() {
  
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setShowContactAlert] = useState(false);
  const [setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch both property info and amenities in parallel
        const [propertyData, amenitiesData] = await Promise.all([
          api.getPropertyById(id),
          api.getPropertyAmenities(id)
        ]);

        setProperty(propertyData);
        setAmenities(amenitiesData);


      } catch (err) {
        console.error("Error fetching property detail:", err);
        setAmenities([]);
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
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px]">
        <img
          src={property.images?.[0]?.image_url || "https://picsum.photos/1200/800"}
          className="w-full h-full object-cover"
          alt={property.title}
        />
        {/* ... Back Button ... */}
        <div className="absolute bottom-6 left-6 text-white">
           {/* Show Availability Badge */}
           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 inline-block ${
             property.availability_status === 'available' ? 'bg-green-500' : 'bg-orange-500'
           }`}>
             {property.availability_status}
           </span>
          <h1 className="text-3xl md:text-5xl font-bold">{property.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
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
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-3">About this {property.property_type}</h3>
            <p className="text-gray-600 leading-relaxed">{property.description}</p>
          </div>

          {/* NEW: Amenities Section */}

        {/* NEW: Amenities Section */}
<div className="bg-white rounded-2xl p-6 border border-gray-100">
  <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
    ✨ What this place offers
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
    <p className="text-gray-400 text-sm italic">No amenities listed.</p>
  )}
</div>
</div>

        </div>

        {/* Right Sidebar: Landlord & Contact */}
        <div className="lg:w-1/3">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h4 className="font-bold mb-4">Listed by</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-[#087474]">
                  {property.landlord_name?.charAt(0) || 'L'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{property.landlord_name || "Landlord"}</p>
                  <p className="text-xs text-gray-500 font-medium">Verified Property Owner</p>
                </div>
              </div>

              <button
                onClick={handleContactLandlord}
                className="w-full bg-[#087474] text-white py-3 rounded-xl font-bold hover:bg-[#066565] transition"
              >
                Book Viewing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  //   <div className="bg-gray-50 min-h-screen">
  //     {/* Hero Section - same as before but with real data */}
  //     <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
  //       <img
  //         src={property.images?.[0]?.image_url || "https://picsum.photos/1200/800"}
  //         className="w-full h-full object-cover"
  //         alt={property.title}
  //       />
  //       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
  //       <Link to="/properties" className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition z-10">
  //         ←
  //       </Link>
  //       <div className="absolute bottom-6 left-6 right-6 text-white">
  //         <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{property.title}</h1>
  //         <p className="text-white/90 text-lg flex items-center gap-2">
  //           📍 {property.city}, {property.district}
  //         </p>
  //       </div>
  //     </div>

  //     <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
  //       {/* Left Column - simplified to available DB fields */}
  //       <div className="lg:w-2/3 space-y-6">
  //         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
  //           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  //             <div>
  //               <p className="text-sm text-gray-500 mb-1">Price</p>
  //               <h2 className="text-3xl md:text-4xl font-bold text-[#087474]">
  //                 {property.price.toLocaleString()} ETB
  //               </h2>
  //             </div>
  //             <div className="flex gap-4 text-gray-600">
  //               <div className="text-center">
  //                 <span className="text-xl">🛏️</span>
  //                 <p className="text-sm font-medium mt-1">{property.bedrooms} Beds</p>
  //               </div>
  //               <div className="text-center">
  //                 <span className="text-xl">🚿</span>
  //                 <p className="text-sm font-medium mt-1">{property.bathrooms} Baths</p>
  //               </div>
  //               <div className="text-center">
  //                 <span className="text-xl">📐</span>
  //                 <p className="text-sm font-medium mt-1">{property.size} m²</p>
  //               </div>
  //             </div>
  //           </div>
  //         </div>

  //         <div className="bg-white rounded-2xl border border-gray-100 p-6">
  //           <h3 className="text-xl font-semibold mb-4">📝 Description</h3>
  //           <p className="text-gray-600 leading-relaxed">{property.description || "No description available yet."}</p>
  //         </div>

  //         <div className="bg-white rounded-2xl border border-gray-100 p-6">
  //           <h3 className="text-xl font-semibold mb-4">📋 Property Details</h3>
  //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  //             <div className="flex items-center gap-3 text-gray-600">
  //               <span className="text-xl">🏠</span>
  //               <div>
  //                 <p className="text-xs text-gray-400">Type</p>
  //                 <p className="text-sm font-medium">{property.property_type}</p>
  //               </div>
  //             </div>
  //             <div className="flex items-center gap-3 text-gray-600">
  //               <span className="text-xl">📍</span>
  //               <div>
  //                 <p className="text-xs text-gray-400">Location</p>
  //                 <p className="text-sm font-medium">{property.city}, {property.district}</p>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Right Sidebar - contact card (booking will replace this later) */}
  //       <div className="lg:w-1/3">
  //         <div className="sticky top-28 space-y-6">
  //           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
  //             <button
  //               onClick={handleContactLandlord}
  //               disabled={isLoading}
  //               className="w-full bg-[#087474] text-white py-3 rounded-xl font-semibold hover:bg-[#066565] disabled:opacity-50"
  //             >
  //               {isLoading ? "Sending..." : "Contact Landlord / Request Booking"}
  //             </button>
  //             {showContactAlert && (
  //               <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
  //                 ✅ Request sent! (Booking module coming next)
  //               </div>
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}
