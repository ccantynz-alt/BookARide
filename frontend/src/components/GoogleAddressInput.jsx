import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Input } from './ui/input';
import axios from 'axios';
import { API } from '../config/api';

/**
 * GoogleAddressInput — Bulletproof address autocomplete.
 *
 * Strategy:
 * 1. Try to load Google Maps JS API and use native Autocomplete
 * 2. If that fails for ANY reason, fall back to server-side proxy
 * 3. If THAT fails, let the user type freely — never block the input
 *
 * The input is ALWAYS typeable. Nothing locks it. Nothing blocks it.
 * LOCKED: Do not change without testing on live site.
 */

let googleMapsState = 'idle'; // idle | loading | loaded | failed
let googleMapsCallbacks = [];

function loadGoogleMaps(apiKey) {
  if (googleMapsState === 'loaded') return Promise.resolve();
  if (googleMapsState === 'failed') return Promise.reject(new Error('Google Maps failed'));
  if (googleMapsState === 'loading') {
    return new Promise((resolve, reject) => {
      googleMapsCallbacks.push({ resolve, reject });
    });
  }

  googleMapsState = 'loading';
  return new Promise((resolve, reject) => {
    googleMapsCallbacks.push({ resolve, reject });

    const timeout = setTimeout(() => {
      googleMapsState = 'failed';
      googleMapsCallbacks.forEach(cb => cb.reject(new Error('Timeout')));
      googleMapsCallbacks = [];
    }, 5000);

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      clearTimeout(timeout);
      googleMapsState = 'loaded';
      googleMapsCallbacks.forEach(cb => cb.resolve());
      googleMapsCallbacks = [];
    };
    script.onerror = () => {
      clearTimeout(timeout);
      googleMapsState = 'failed';
      googleMapsCallbacks.forEach(cb => cb.reject(new Error('Script load failed')));
      googleMapsCallbacks = [];
    };
    document.head.appendChild(script);
  });
}

let cachedApiKey = null;

async function getApiKey() {
  if (cachedApiKey) return cachedApiKey;
  try {
    const resp = await axios.get(`${API}/maps/client-key`);
    if (resp.data?.key) {
      cachedApiKey = resp.data.key;
      return cachedApiKey;
    }
  } catch {
    // Key endpoint failed
  }
  return null;
}

const GoogleAddressInput = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address...',
  id,
  required,
  disabled,
  className = '',
  region = 'nz',
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [useNative, setUseNative] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  // Keep callbacks in refs so Autocomplete listener doesn't depend on them
  const onSelectRef = useRef(onSelect);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onChangeRef.current = onChange;
  }, [onSelect, onChange]);

  // Try to load Google Maps native autocomplete
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await getApiKey();
        if (!key || cancelled) return;
        await loadGoogleMaps(key);
        if (!cancelled) setUseNative(true);
      } catch {
        // Failed — use fallback, input stays functional
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Attach native Google Autocomplete when ready
  useEffect(() => {
    if (!useNative || !inputRef.current || autocompleteRef.current) return;
    if (!window.google?.maps?.places) {
      setUseNative(false);
      return;
    }

    try {
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: region },
        fields: ['formatted_address', 'name'],
      });

      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const address = place?.formatted_address || place?.name || '';
        if (address) {
          if (onSelectRef.current) onSelectRef.current(address);
          else if (onChangeRef.current) onChangeRef.current(address);
        }
      });

      autocompleteRef.current = ac;

      // Ensure Google dropdown renders above modals
      const style = document.createElement('style');
      style.textContent = '.pac-container { z-index: 999999 !important; }';
      document.head.appendChild(style);
    } catch {
      setUseNative(false);
    }

    return () => {
      if (autocompleteRef.current) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch { /* ignore */ }
        autocompleteRef.current = null;
      }
    };
  }, [useNative, region]);

  // Fallback: server-side autocomplete
  const fetchSuggestions = useCallback((text) => {
    clearTimeout(debounceRef.current);
    if (!text || text.length < 3 || useNative) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const resp = await axios.get(`${API}/places/autocomplete`, {
          params: { input: text, region },
        });
        const preds = resp.data?.predictions || [];
        setSuggestions(preds);
        setShowDropdown(preds.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);
  }, [region, useNative]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (onChange) onChange(val);
    if (!useNative) fetchSuggestions(val);
  };

  const handleSelectSuggestion = (description) => {
    setShowDropdown(false);
    setSuggestions([]);
    if (onSelect) onSelect(description);
    else if (onChange) onChange(description);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e) => {
      if (inputRef.current && !inputRef.current.parentElement.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [showDropdown]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className={`transition-all duration-200 focus:ring-2 focus:ring-gold ${className}`}
      />
      {!useNative && showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto z-[99999]">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectSuggestion(s.description)}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-0"
            >
              {s.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoogleAddressInput;
