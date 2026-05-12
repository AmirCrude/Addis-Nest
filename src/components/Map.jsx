import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Helper component to ensure all markers are visible
function FitBounds({ properties }) {
  const map = useMap();

  useEffect(() => {
    if (!properties || properties.length === 0) return;

    // More robust validation
    const validPoints = properties
      .filter(p => {
        const lat = parseFloat(p.latitude);
        const lng = parseFloat(p.longitude);
        return !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng);
      })
      .map(p => {
        const lat = parseFloat(p.latitude);
        const lng = parseFloat(p.longitude);
        return [lat, lng];
      });

    if (validPoints.length === 1) {
      // If only one point, center on it with a fixed zoom
      map.setView(validPoints[0], 13);
    } else if (validPoints.length > 1) {
      try {
        const bounds = L.latLngBounds(validPoints);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
        // Fallback to first valid point
        if (validPoints[0]) {
          map.setView(validPoints[0], 13);
        }
      }
    }
  }, [properties, map]);

  return null;
}

// Component for each property popup
function PropertyPopup({ property }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/properties/${property.property_id}`);
  };

  return (
    <div className="text-sm min-w-[220px] max-w-[280px] p-2">
      {/* Property Image */}
      {property.images && property.images[0] && (
        <div className="mb-3 rounded-lg overflow-hidden h-32">
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Title */}
      <h3 className="font-bold text-gray-800 text-base mb-2 line-clamp-2">
        {property.title}
      </h3>
      
      {/* Location */}
      <div className="flex items-center gap-1 text-gray-600 mb-2">
        <span>📍</span>
        <p className="text-xs">
          {property.district && property.city 
            ? `${property.district}, ${property.city}`
            : property.district || property.city || "Location not specified"}
        </p>
      </div>
      
      {/* Price */}
      <div className="mb-3">
        <p className="text-emerald-700 font-bold text-lg">
          {Number(property.price).toLocaleString()} 
          <span className="text-xs font-normal"> ETB/mo</span>
        </p>
      </div>
      
      {/* Property Details */}
      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2 mb-3">
        {property.bedrooms && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Beds</span>
            <span className="font-semibold text-gray-800">{property.bedrooms}</span>
          </div>
        )}
        {property.bathrooms && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Baths</span>
            <span className="font-semibold text-gray-800">{property.bathrooms}</span>
          </div>
        )}
        {property.size && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Size</span>
            <span className="font-semibold text-gray-800">{property.size} m²</span>
          </div>
        )}
        {property.property_type && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500">Type</span>
            <span className="font-semibold text-gray-800 capitalize">{property.property_type}</span>
          </div>
        )}
      </div>
      
      {/* Availability Status */}
      {property.availability_status && (
        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
            ${property.availability_status === 'available' 
              ? 'bg-green-100 text-green-700' 
              : property.availability_status === 'rented'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
            }`}>
            {property.availability_status.charAt(0).toUpperCase() + property.availability_status.slice(1)}
          </span>
        </div>
      )}
      
      {/* View Details Button */}
      <button
        onClick={handleViewDetails}
        className="w-full bg-[#087474] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#066565] transition-all active:scale-95 text-sm"
      >
        View Full Details →
      </button>
    </div>
  );
}

export default function Map({ properties = [] }) {
  const defaultCenter = [9.032, 38.7469]; // Addis Ababa

  // Create icon inside component to ensure Leaflet is loaded
  const customIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }, []);

  // Fix the default icon issue
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  // Filter valid properties and log issues
  const validProperties = useMemo(() => {
    const valid = properties.filter((property, index) => {
      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      
      if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        console.warn(`Invalid property at index ${index}:`, {
          id: property.id || property.property_id,
          title: property.title,
          latitude: property.latitude,
          longitude: property.longitude,
          raw_lat_type: typeof property.latitude,
          raw_lng_type: typeof property.longitude
        });
        return false;
      }
      
      return true;
    });

    return valid;
  }, [properties]);

  // If no valid properties, show a message
  if (validProperties.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 h-[450px] w-full">
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <p className="text-gray-500">No properties with valid locations to display</p>
          </div>
        </MapContainer>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 h-[450px] w-full">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Force map to zoom to show ALL valid properties */}
        <FitBounds properties={validProperties} />

        {validProperties.map((property) => {
          const lat = parseFloat(property.latitude);
          const lng = parseFloat(property.longitude);

          return (
            <Marker 
              key={property.property_id || property.id} 
              position={[lat, lng]}
              icon={customIcon}
            >
              <Popup maxWidth={300} minWidth={250}>
                <PropertyPopup property={property} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}