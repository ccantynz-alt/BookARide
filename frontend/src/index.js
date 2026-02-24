import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from '@vuer-ai/react-helmet-async';
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);
