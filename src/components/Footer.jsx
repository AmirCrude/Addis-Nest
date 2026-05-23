// src/components/Footer.jsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Hide footer on login and register pages
  const hideFooter = location.pathname === "/login" || location.pathname === "/register";

  if (hideFooter) return null;

  return (
    <footer className="bg-[#0b3d3d] text-white py-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <h2 className="text-lg font-bold mb-2">AddisNest</h2>
          <p className="text-xs text-white/70">Find trusted rental homes across Ethiopia.</p>
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-2">Links</h3>
          <ul className="space-y-1 text-xs text-white/70">
            <li><Link to="/" className="hover:text-[#fbbf24] transition">Home</Link></li>
            <li><Link to="/properties" className="hover:text-[#fbbf24] transition">Properties</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-2">Account</h3>
          <ul className="space-y-1 text-xs text-white/70">
            {!user ? (
              <>
                <li><Link to="/login" className="hover:text-[#fbbf24] transition">Login</Link></li>
                <li><Link to="/register" className="hover:text-[#fbbf24] transition">Register</Link></li>
              </>
            ) : (
              <li><Link to={user.role === 'landlord' ? '/landlord' : '/tenant-dashboard'} className="hover:text-[#fbbf24] transition">Dashboard</Link></li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-2">Contact</h3>
          <p className="text-xs text-white/70">Addis Ababa, Ethiopia</p>
        </div>
      </div>
      <div className="text-center text-white/40 text-xs mt-6">
        &copy; {new Date().getFullYear()} AddisNest
      </div>
    </footer>
  );
}