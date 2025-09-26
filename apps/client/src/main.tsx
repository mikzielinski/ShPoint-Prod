import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./debug-env.js";
import "./styles/global.css";
import "./styles/shatterpoint-icons.css";
import "./lib/icons.css";
import AppRoutes from "./AppRoutes";
import { AuthProvider } from "./auth/AuthContext";
import { initTheme } from "./theme/theme-init";

initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);// Force rebuild Sat Sep 27 01:24:31 CEST 2025
