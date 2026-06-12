/**
 * Build-time server entry, loaded by scripts/prerender.mjs through Vite.
 *
 * Renders the same route tree as the browser (AppRoutes from App.jsx) under
 * a StaticRouter, waiting for all lazy chunks via onAllReady so the emitted
 * HTML contains the real page content — not the Suspense spinner.
 *
 * The browser entry (main.jsx) is untouched: it mounts with createRoot and
 * REPLACES the prerendered markup (no hydration), so there is zero risk of
 * hydration mismatches breaking the booking flow. Crawlers and AI engines
 * get full HTML; browsers get the exact same SPA behaviour as before.
 */
import React from 'react';
import { Writable } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { AppRoutes } from './App';

export function render(url) {
  const helmetContext = {};

  return new Promise((resolve, reject) => {
    let body = '';
    let renderError = null;

    const stream = renderToPipeableStream(
      <HelmetProvider context={helmetContext}>
        <div className="App">
          <StaticRouter location={url}>
            <AppRoutes />
          </StaticRouter>
        </div>
      </HelmetProvider>,
      {
        onAllReady() {
          if (renderError) {
            reject(renderError);
            return;
          }
          const sink = new Writable({
            write(chunk, _enc, cb) {
              body += chunk;
              cb();
            },
            final(cb) {
              resolve({ html: body, helmet: helmetContext.helmet });
              cb();
            },
          });
          stream.pipe(sink);
        },
        onError(err) {
          renderError = err;
        },
        onShellError(err) {
          reject(err);
        },
      },
    );
  });
}
