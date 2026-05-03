// src/components/Navbar.jsx
import { useState } from "react"; // Add useState
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State for Pop-up

  const handleScrollToAbout = () => {
    const section = document.getElementById("about");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/");
  };

  return (
    <>
      <nav className="fixed w-full z-[1001] bg-[#0b3d3d] border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* ... (Logo and Links) */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-semibold tracking-tight group">
            <span className="text-[#fbbf24] text-3xl group-hover:scale-110 transition-transform">🏠</span>
            <span className="text-white">Addis</span><span className="text-[#fbbf24]">Nest</span>
          </Link>

          <div className="hidden md:flex items-center gap-10 text-white/90 font-medium">
            <Link to="/" className="relative group">Home</Link>
            <Link to="/properties" className="relative group">Properties</Link>
            {user?.role === "landlord" && (
              <Link to="/landlord" className="relative group text-[#fbbf24] font-bold">Landlord</Link>
            )}
            <button onClick={handleScrollToAbout} className="relative group hover:text-white transition">About</button>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login"><button className="px-4 py-2 text-white/80 hover:text-white transition">Login</button></Link>
                <Link to="/register"><button className="px-5 py-2 rounded-full bg-[#fbbf24] text-black font-medium hover:scale-105 transition">Sign Up</button></Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-7 h-7 bg-[#fbbf24] rounded-full flex items-center justify-center text-black font-bold text-xs">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium">{user.name}</span>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)} // Open Modal instead of logging out immediately
                  className="text-white/60 hover:text-white transition text-sm ml-2 font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLogoutModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                🚪
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Leave?</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                You are about to log out of your session. Do you want to continue?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition shadow-lg shadow-red-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
