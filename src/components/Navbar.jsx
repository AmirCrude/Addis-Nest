// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const handleScrollToAbout = () => {
    const section = document.getElementById("about");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed w-full z-50 bg-[#0b3d3d] border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-semibold tracking-tight group"
        >
          <span className="text-[#fbbf24] text-3xl group-hover:scale-110 transition-transform">
            🏠
          </span>
          <span className="text-white">Addis</span>
          <span className="text-[#fbbf24]">Nest</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-10 text-white/90 font-medium">
          
          <Link to="/" className="relative group">
            Home
          </Link>

          <Link to="/properties" className="relative group">
            Properties
          </Link>

          {/* Landlord button - ONLY for logged-in landlords */}
          {user?.role === "landlord" && (
            <Link to="/landlord" className="relative group">
              Landlord
            </Link>
          )}

          {/* About (scrolls) */}
          <button
            onClick={handleScrollToAbout}
            className="relative group hover:text-white transition"
          >
            About
          </button>

        </div>

        {/* Auth Buttons - CONDITIONAL */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login">
                <button className="px-4 py-2 rounded-full text-white/80 hover:text-white transition">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="px-5 py-2 rounded-full bg-[#fbbf24] text-black font-medium hover:scale-105 transition">
                  Sign Up
                </button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#fbbf24] rounded-full flex items-center justify-center text-black font-semibold">
                  {user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-white">
                  {user.firstName || user.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-white/60 hover:text-white transition text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}