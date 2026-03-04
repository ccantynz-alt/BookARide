import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from '@vuer-ai/react-helmet-async';
import "@/index.css";
import App from "@/App";

const rootEl = document.getElementById("root");

function showFatalError(message, stack) {
  if (!rootEl) return;
  rootEl.innerHTML = [
    '<div style="min-height:100vh;background:#0f172a;color:#e2e8f0;padding:2rem;font-family:system-ui,sans-serif;box-sizing:border-box">',
    '<h1 style="font-size:1.25rem;margin-bottom:0.5rem">Something went wrong</h1>',
    '<p style="color:#f87171;word-break:break-word;margin-bottom:1rem">' + (message || 'Unknown error').replace(/</g, '&lt;') + '</p>',
    stack ? '<pre style="font-size:0.7rem;background:#1e293b;padding:1rem;overflow:auto;border-radius:6px;white-space:pre-wrap;word-break:break-word;max-height:40vh">' + String(stack).replace(/</g, '&lt;') + '</pre>' : '',
    '<button onclick="window.location.reload()" style="padding:0.5rem 1rem;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer">Reload page</button>',
    '</div>'
  ].join('');
}

window.onerror = function (message, source, lineno, colno, error) {
  const stack = (error && error.stack)
    ? error.stack
    : (source ? source + (lineno != null ? ':' + lineno + (colno != null ? ':' + colno : '') : '') : '');
  console.error('Uncaught error:', message, stack);
  showFatalError(String(message), stack);
  return true;
};
window.onunhandledrejection = function (e) {
  e.preventDefault();
  const msg = e.reason?.message ?? String(e.reason);
  const stack = e.reason?.stack;
  console.error('Unhandled rejection:', msg, stack);
  showFatalError(msg, stack);
};

if (!rootEl) {
  document.body.innerHTML = '<div style="padding:2rem;font-family:system-ui;color:#dc2626">Root element #root not found.</div>';
  throw new Error('Root element #root not found');
}
const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);
