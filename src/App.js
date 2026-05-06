// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import LandlordDashboard from './pages/LandlordDashboard';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import TenantDashboard from './pages/TenantDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter
      future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true 
      }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/landlord" element={<LandlordDashboard />} />
          <Route path="/tenant-dashboard" element={<TenantDashboard />} />
          <Route path="/add-property" element={<AddProperty />} />
          <Route path="/edit-property/:id" element={<EditProperty />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;