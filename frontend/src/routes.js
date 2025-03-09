import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";  // ✅ 반드시 중괄호 없이!
import About from "./pages/About"; // ✅ 반드시 중괄호 없이!
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
