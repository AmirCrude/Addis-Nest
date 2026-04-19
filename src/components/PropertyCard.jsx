import { Link } from "react-router-dom";

export default function PropertyCard({ property }) {
  const location = `${property.city || ""}, ${property.district || ""}`.trim();
  const imageUrl = property.images?.[0]?.image_url || "https://picsum.photos/400/300";

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <img src={imageUrl} alt={property.title} className="w-full h-52 object-cover" />
        <div className="absolute top-3 left-3 bg-[#087474] text-white text-xs px-3 py-1 rounded-full">
          {property.property_type || "Apartment"}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{property.title}</h3>
        <p className="text-gray-500 text-sm mb-3">📍 {location}</p>
        <div className="flex justify-between text-gray-600 text-sm mb-4">
          <span>{property.bedrooms} 🛏️</span>
          <span>{property.bathrooms} 🚿</span>
          <span>{property.size} m²</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-[#087474]">
            {property.price} ETB
          </span>
          <Link to={`/property/${property.id}`}>
            <button className="bg-[#087474] text-white px-4 py-2 rounded-xl hover:bg-[#066565] transition text-sm">
              View Details →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}