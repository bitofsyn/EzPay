import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";  // ✅ 올바른 import
import "./index.css";  // ✅ Tailwind 적용 확인

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
