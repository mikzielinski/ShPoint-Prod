console.log("Build time env:", {
  VITE_API_BASE: import.meta.env.VITE_API_BASE,
  VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD
});
