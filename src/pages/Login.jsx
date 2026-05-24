// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.login(form.email, form.password);
      
      if (response.status === 'success' && response.user?.token) {
        const token = response.user.token;
        
        const decoded = jwtDecode(token);
    
        const userData = {
          email: form.email,
          role: response.user.role,
          id: decoded.userId, 
          name: decoded.name,
        };
        
        login(token, userData);

        // Check for redirect URL first, then navigate based on role
        const redirectTo = searchParams.get("redirect");

        if (redirectTo) {
          navigate(redirectTo);
        } else if (response.user.role === 'landlord') {
          navigate("/landlord");
        } else if (response.user.role === 'tenant') {
          navigate("/tenant-dashboard");
        } else if (response.user.role === 'admin') {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    
    } catch (err) {
      setError(err.message || "Something went wrong");
      console.error("Login error:", err);
      setForm(prev => ({ ...prev, password: "" })); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md mt-20 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2 text-[#087474]">🏠</div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Sign in to your AddisNest account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087474]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087474]"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#087474] text-white py-3 rounded-lg font-semibold hover:bg-[#066565] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#087474] font-medium hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}