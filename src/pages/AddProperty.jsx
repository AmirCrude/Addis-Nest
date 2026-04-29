import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddProperty() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    location: "",
    price: "",
    image: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    description: "",
    type: "Apartment",
    latitude: "",
    longitude: "",
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [showMap, setShowMap] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      image: value,
    }));

    setImagePreview(value);
  };

  const handleLocationSelect = () => {
    setForm((prev) => ({
      ...prev,
      latitude: "9.0320",
      longitude: "38.7469",
      location: "Addis Ababa, Ethiopia",
    }));

    setShowMap(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) newErrors.title = "Required";
    if (!form.location.trim()) newErrors.location = "Required";
    if (!form.price) newErrors.price = "Required";
    if (!form.image.trim()) newErrors.image = "Required";
    if (!form.bedrooms) newErrors.bedrooms = "Required";
    if (!form.bathrooms) newErrors.bathrooms = "Required";
    if (!form.area) newErrors.area = "Required";
    if (!form.description.trim()) newErrors.description = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newProperty = {
      id: Date.now(),
      ...form,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      area: Number(form.area),
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      status: "available",
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("properties")) || [];
    localStorage.setItem("properties", JSON.stringify([...existing, newProperty]));

    alert("Property added!");
    navigate("/landlord");
  };

  return (
    <div className="min-h-screen bg-[#0b3d3d] px-6 py-20">
      
      {/* container */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-start">

        {/* LEFT INFO PANEL */}
        <div className="text-white space-y-6 hidden md:block pt-8">
          <h1 className="text-4xl font-bold leading-tight">
            Add Your Property 🚀
          </h1>

          <p className="text-white/70">
            List your property in seconds and reach real tenants faster.
            Make sure your details are clear and attractive.
          </p>

          <div className="space-y-3 text-white/80">
            <p>✔ High quality images = more bookings</p>
            <p>✔ Correct location increases visibility</p>
            <p>✔ Clear pricing builds trust</p>
          </div>

          <div className="bg-white/10 p-4 rounded-xl">
            <p className="text-sm text-white/70">
              Tip: Properties with images get 3x more attention.
            </p>
          </div>
        </div>

        {/* FORM CARD */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-12 mt-4 space-y-4"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Property Details
          </h2>

          {/* TITLE */}
          <input
            name="title"
            value={form.title}
            placeholder="Title"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}

          {/* LOCATION */}
          <div className="flex gap-2">
            <input
              name="location"
              value={form.location}
              placeholder="Location"
              onChange={handleChange}
              className="flex-1 border p-2 rounded"
            />
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="bg-gray-200 px-3 rounded"
            >
              🗺️
            </button>
          </div>

          {showMap && (
            <div className="bg-gray-100 p-3 rounded text-center">
              <button
                type="button"
                onClick={handleLocationSelect}
                className="bg-[#fbbf24] px-3 py-2 rounded"
              >
                Use Default Location
              </button>
            </div>
          )}

          {/* LAT LNG */}
          <div className="grid grid-cols-2 gap-2">
            <input
              name="latitude"
              value={form.latitude}
              placeholder="Latitude"
              onChange={handleChange}
              className="border p-2 rounded"
            />
            <input
              name="longitude"
              value={form.longitude}
              placeholder="Longitude"
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          {/* PRICE */}
          <input
            name="price"
            type="number"
            value={form.price}
            placeholder="Price"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* IMAGE */}
          <input
            name="image"
            value={form.image}
            placeholder="Image URL"
            onChange={handleImageChange}
            className="w-full border p-2 rounded"
          />

          {imagePreview && (
            <img
              src={imagePreview}
              className="w-full h-40 object-cover rounded"
              alt="preview"
            />
          )}

          {/* GRID */}
          <div className="grid grid-cols-3 gap-2">
            <input
              name="bedrooms"
              value={form.bedrooms}
              placeholder="Beds"
              onChange={handleChange}
              className="border p-2 rounded"
            />
            <input
              name="bathrooms"
              value={form.bathrooms}
              placeholder="Baths"
              onChange={handleChange}
              className="border p-2 rounded"
            />
            <input
              name="area"
              value={form.area}
              placeholder="Area"
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </div>

          {/* TYPE */}
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option>Apartment</option>
            <option>House</option>
            <option>Villa</option>
            <option>Studio</option>
          </select>

          {/* DESCRIPTION */}
          <textarea
            name="description"
            value={form.description}
            placeholder="Description"
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {/* BUTTON */}
          <button className="w-full bg-[#fbbf24] py-3 rounded font-semibold hover:bg-[#f59e0b] transition">
            Save Property
          </button>
        </form>
      </div>
    </div>
  );
}