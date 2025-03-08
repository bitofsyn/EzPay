import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";  // ✅ 반드시 중괄호 없이!
import About from "./pages/About"; // ✅ 반드시 중괄호 없이!

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
