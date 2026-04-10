import React, { useState, useEffect } from 'react';

/**
 * /driver-sign — Full-screen BookARide pickup sign for the iPad.
 *
 * Standalone route (no header, no footer). Optimised for holding up
 * at the arrivals gate when PowerPoint / printed signs fail.
 *
 * Usage:
 *   /driver-sign                   → blank BookARide sign
 *   /driver-sign?name=John%20Smith → BookARide sign with passenger name
 *
 * Tip: Rotate iPad to landscape. Tap the screen to toggle between
 * BLACK-background (high contrast indoors) and GOLD-background
 * (maximum visibility in crowded arrival halls).
 */
export default function DriverSign() {
  const params = new URLSearchParams(window.location.search);
  const initialName = params.get('name') || '';

  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(!initialName);
  const [goldMode, setGoldMode] = useState(false);

  // Force the document title + prevent scrolling so the sign fills the screen
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'BookARide Driver Sign';
    document.body.style.overflow = 'hidden';
    return () => {
      document.title = prevTitle;
      document.body.style.overflow = '';
    };
  }, []);

  // Try to wake-lock the screen so the iPad doesn't go to sleep
  useEffect(() => {
    let wakeLock = null;
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => {
        wakeLock = lock;
      }).catch(() => {});
    }
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  const bgClass = goldMode ? 'bg-[#D4AF37]' : 'bg-black';
  const brandColor = goldMode ? '#000000' : '#D4AF37';
  const textColor = goldMode ? '#000000' : '#ffffff';

  return (
    <div
      className={`fixed inset-0 ${bgClass} flex flex-col items-center justify-center cursor-pointer select-none`}
      onClick={() => !editing && setGoldMode(m => !m)}
    >
      {/* BOOKARIDE brand */}
      <div
        className="font-black tracking-tight text-center leading-none"
        style={{
          color: brandColor,
          fontSize: 'clamp(60px, 14vw, 240px)',
          fontFamily: 'Arial Black, Helvetica, sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        BookARide
      </div>

      {/* Gold underline accent (only in black mode) */}
      {!goldMode && (
        <div
          className="mt-4"
          style={{
            width: '60%',
            height: '6px',
            backgroundColor: '#D4AF37',
            borderRadius: '3px',
          }}
        />
      )}

      {/* Passenger name */}
      {name && !editing ? (
        <div
          className="mt-12 font-bold text-center px-8"
          style={{
            color: textColor,
            fontSize: 'clamp(48px, 10vw, 180px)',
            fontFamily: 'Arial, Helvetica, sans-serif',
            letterSpacing: '-0.01em',
          }}
        >
          {name}
        </div>
      ) : null}

      {/* Subtitle (only when no name) */}
      {!name && !editing && (
        <div
          className="mt-8 text-center px-8"
          style={{
            color: textColor,
            fontSize: 'clamp(20px, 3vw, 48px)',
            fontFamily: 'Arial, Helvetica, sans-serif',
            opacity: 0.85,
          }}
        >
          Premium Airport Transfers
        </div>
      )}

      {/* Edit name overlay */}
      {editing && (
        <div
          className="mt-10 w-[80%] max-w-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(false);
            }}
            placeholder="Passenger name"
            className="w-full px-8 py-6 text-center rounded-2xl border-4 font-bold"
            style={{
              fontSize: 'clamp(32px, 6vw, 80px)',
              backgroundColor: goldMode ? '#000' : '#fff',
              color: goldMode ? '#D4AF37' : '#000',
              borderColor: '#D4AF37',
              outline: 'none',
            }}
          />
          <button
            onClick={() => setEditing(false)}
            className="mt-6 w-full py-5 rounded-2xl font-bold text-white"
            style={{
              backgroundColor: '#D4AF37',
              fontSize: 'clamp(20px, 3vw, 40px)',
            }}
          >
            Display Sign
          </button>
        </div>
      )}

      {/* Edit button (tiny, bottom-right, only when not editing) */}
      {!editing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="fixed bottom-6 right-6 px-4 py-2 rounded-lg text-sm font-medium opacity-40 hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: goldMode ? '#000' : '#D4AF37',
            color: goldMode ? '#D4AF37' : '#000',
          }}
        >
          Edit
        </button>
      )}

      {/* Tap hint (only briefly on first load, no name yet) */}
      {!editing && !name && (
        <div
          className="fixed bottom-6 left-6 text-xs opacity-30"
          style={{ color: textColor }}
        >
          Tap to toggle gold background
        </div>
      )}
    </div>
  );
}
