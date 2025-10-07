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

// Global fetch interceptor to add JWT token to all requests
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [resource, config] = args;
  
  // Only intercept requests to our API
  const url = typeof resource === 'string' ? resource : resource.url;
  const isApiRequest = url.includes('shpoint-prod.onrender.com') || url.includes('/api/');
  
  if (!isApiRequest) {
    return originalFetch(resource, config);
  }
  
  // Get JWT token from localStorage
  const token = localStorage.getItem('shpoint_auth_token');
  
  // Add Authorization header if token exists
  if (token) {
    let headers;
    
    // Handle different header types
    if (config?.headers instanceof Headers) {
      headers = new Headers(config.headers);
    } else if (config?.headers) {
      headers = new Headers(config.headers);
    } else {
      headers = new Headers();
    }
    
    // Only add if not already present
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log('🔐 [Fetch Interceptor] Added Bearer token to:', url.substring(0, 60) + '...');
      console.log('🔐 [Fetch Interceptor] Token length:', token.length);
      console.log('🔐 [Fetch Interceptor] Headers:', Array.from(headers.entries()));
    } else {
      console.log('🔐 [Fetch Interceptor] Authorization header already present, not adding token');
    }
    
    // Ensure credentials are included
    return originalFetch(resource, {
      ...config,
      credentials: config?.credentials || 'include',
      headers
    });
  }
  
  // No token - still ensure credentials for session-based auth
  return originalFetch(resource, {
    ...config,
    credentials: config?.credentials || 'include'
  });
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);// Force rebuild Sat Sep 27 01:24:31 CEST 2025
// Force rebuild Sat Sep 27 01:26:59 CEST 2025 - 4E597461-6596-44D1-A15C-8AA87F728A80
// Force rebuild Sat Sep 27 01:36:07 CEST 2025 - 6814B14C-DCC1-40CA-A69D-8472EF858728 - ade46ef04bf3cdae
// Force rebuild Sat Sep 27 01:39:36 CEST 2025 - C75D60E5-A056-4AD3-A811-942B6D5D0BAE - 9c4c6f4ba2ecb7841003cb1e77a90147
// Force rebuild Sat Sep 27 01:39:54 CEST 2025 - 56C93D20-7076-41CC-A491-46271460B2AE - f9e5a71b5243965972d0f119ad03a3161be70b22a2dd03f1cefaef4ba4584296
// Force rebuild Sat Sep 27 01:42:21 CEST 2025 - D81AF471-20EF-4EE4-B985-04EC0791307A - ea8b0094c9144972fee76868eebbc4b7324e955eba4c1a0f4049ab10657cfa75ef370d76a48153d3e05b5a66f5353abc3f9034e444189eb3348cf8a8edbbfc5c
// Force Netlify rebuild Tue Oct  7 23:05:58 CEST 2025
