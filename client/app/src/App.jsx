// App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import UserDashboard from "./pages/User/UserDashboard";
import PublicDashBoard from "./pages/Public/PublicDashBoard";
import Navbar from "./components/Navbar/Navbar";
import "./App.css";

function App() {
  const location = useLocation();
  const noNavbarPaths = ["/login", "/register"];
  const showNavbar = !noNavbarPaths.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<PublicDashBoard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/userdashboard" element={<UserDashboard />} />
      </Routes>
    </>
  );
}

export default App;
