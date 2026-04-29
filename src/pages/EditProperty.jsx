import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const initialForm = {
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
  status: "available",
};

export default function EditProperty() {
  const navigate = useNavigate();
  const { id } = useParams();
  const propertyId = Number(id);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔹 Load property
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("properties")) || [];
    const property = stored.find((p) => p.id === propertyId);

    if (!property) {
      alert("Property not found");
      navigate("/landlord");
      return;
    }

    setForm({ ...initialForm, ...property });
    setImagePreview(property.image || "");
    setLoading(false);
  }, [propertyId, navigate]);

  // 🔹 Handle input
  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleChange = (e) => {
    updateField(e.target.name, e.target.value);
  };

  const handleImageChange = (e) => {
    const value = e.target.value;
    updateField("image", value);
    setImagePreview(value);
  };

  // 🔹 Validation
  const validate = () => {
    const required = [
      "title",
      "location",
      "price",
      "image",
      "bedrooms",
      "bathrooms",
      "area",
      "description",
    ];

    const newErrors = {};

    required.forEach((field) => {
      if (!form[field]?.toString().trim()) {
        newErrors[field] = "Required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const updatedProperty = {
      ...form,
      id: propertyId,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      area: Number(form.area),
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      updatedAt: new Date().toISOString(),
    };

    const stored = JSON.parse(localStorage.getItem("properties")) || [];

    const updated = stored.map((p) =>
      p.id === propertyId ? updatedProperty : p
    );

    localStorage.setItem("properties", JSON.stringify(updated));
    navigate("/landlord");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b3d3d] text-white">
        Loading...
      </div>
    );
  }

  // 🔹 Reusable Input
  const Input = ({ name, label, type = "text" }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        className={`w-full border p-2 rounded focus:ring-2 focus:ring-[#fbbf24] focus:outline-none ${
          errors[name] ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b3d3d]">
      
      {/* HEADER */}
      <div className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate("/landlord")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>

          <h1 className="text-lg font-semibold text-gray-800">
            Edit Property
          </h1>

          <div className="w-16" />
        </div>
      </div>

      {/* SMALL WHITE GAP */}
      <div className="h-4 bg-white"></div>

      {/* FORM */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow space-y-4"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Property Details
          </h2>

          <Input name="title" label="Title" />
          <Input name="location" label="Location" />
          <Input name="price" label="Price" type="number" />

          {/* IMAGE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              value={form.image}
              onChange={handleImageChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-[#fbbf24]"
            />
          </div>

          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              className="h-40 w-full object-cover rounded border"
            />
          )}

          {/* GRID */}
          <div className="grid grid-cols-3 gap-3">
            <Input name="bedrooms" label="Beds" type="number" />
            <Input name="bathrooms" label="Baths" type="number" />
            <Input name="area" label="Area" type="number" />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-[#fbbf24]"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/landlord")}
              className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 bg-[#fbbf24] text-gray-900 py-2 rounded font-semibold hover:bg-[#f59e0b]"
            >
              Update Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}