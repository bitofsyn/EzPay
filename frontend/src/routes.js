import { BrowserRouter, Routes, Route } from "react-router-dom";
import pages from "./utils/loadPage";
import NotFound from "./pages/NotFound";

console.log("Loaded Pages:", pages);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<pages.Home />} />
        <Route path="/login" element={<pages.Login />} />
        <Route path="/signup" element={<pages.Signup />} />
        <Route path="/dashboard" element={<pages.Dashboard />} />
        <Route path="/send" element={<pages.SendMoney />} />
        <Route path="/create-account" element={<pages.CreateAccount />}/>
        <Route path="/transactions" element={<pages.TransactionHistory />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
