// src/components/PropertyCard.jsx
import { Link } from "react-router-dom";

export default function PropertyCard({ property }) {
  return (
    <div className="bg-[#0b3d3d] text-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition group">
      <div className="relative h-40 overflow-hidden">
      <img
        src={property.images?.[0] 
            ? `http://localhost:5000${property.images[0]}` 
            : (property.mainImage || `https://picsum.photos/seed/${property.property_id}/800/600`)
          }
        alt={property.title}
        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
        onError={(e) => {
          e.target.src = `https://picsum.photos/seed/${property.property_id}/800/600`;
        }}
      />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        <span className="absolute top-3 left-3 bg-[#087474] text-xs px-2 py-1 rounded-full">
          {property.availability_status}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold">{property.title}</h3>
        <p className="text-white/90 text-xs mt-1 flex items-center gap-1">
          <span className="text-white/50">📍</span>
          <span className="font-bold text-[#fbbf24]">{property.district}</span>
          <span className="text-white/50">|</span>
          <span className="text-white/60">{property.city}</span>
        </p>
        <div className="flex justify-between text-xs text-white/60 mt-2 border-b border-white/10 pb-2">
          {property.bedrooms > 0 && <span>{property.bedrooms} Bed</span>}
          {property.bathrooms > 0 && <span>{property.bathrooms} Bath</span>}
          {property.size > 0 && <span>{property.size} m²</span>}
          {property.floor_number > 0 && <span>{property.floor_number} Floor</span>}
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <span className="text-lg font-bold">
            {property.price} ETB
          </span>
          
          <Link to={`/properties/${property.property_id}`}>
            <button className="bg-[#fbbf24] text-black px-3 py-1.5 rounded-md text-xs font-semibold hover:scale-105 transition">
              View
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}