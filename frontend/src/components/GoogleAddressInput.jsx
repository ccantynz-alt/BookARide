import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Input } from './ui/input';
import axios from 'axios';
import { API } from '../config/api';

/**
 * GoogleAddressInput
 *
 * Uses Google's NATIVE Places Autocomplete widget — the dropdown is rendered
 * and managed entirely by Google, not by React. This eliminates all conflicts
 * with Radix Dialog, React Portals, and iOS touch event handling.
 *
 * The Google Maps JS API is loaded dynamically on first mount.
 * The API key is fetched from the backend to keep it server-managed.
 *
 * Props:
 *   value        – controlled string value
 *   onChange     – called when user types (controlled input)
 *   onSelect     – called with full address string when user picks a suggestion
 *   placeholder  – input placeholder text
 *   id, required, disabled, className – standard input props
 *   region       – bias results to this region (default "nz")
 */

let googleMapsLoaded = false;
let googleMapsLoading = false;
let googleMapsCallbacks = [];

function loadGoogleMaps(apiKey) {
  if (googleMapsLoaded) return Promise.resolve();
  if (googleMapsLoading) {
    return new Promise((resolve) => googleMapsCallbacks.push(resolve));
  }
  googleMapsLoading = true;
  return new Promise((resolve, reject) => {
    googleMapsCallbacks.push(resolve);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      googleMapsCallbacks.forEach((cb) => cb());
      googleMapsCallbacks = [];
    };
    script.onerror = () => {
      googleMapsLoading = false;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });
}

let cachedApiKey = null;

async function getApiKey() {
  if (cachedApiKey) return cachedApiKey;
  try {
    const resp = await axios.get(`${API}/maps/client-key`);
    cachedApiKey = resp.data.key;
    return cachedApiKey;
  } catch {
    return null;
  }
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
  const [ready, setReady] = useState(googleMapsLoaded);
  const [fallback, setFallback] = useState(false);
  const skipNextChange = useRef(false);

  // Hold the latest onChange/onSelect in refs so the autocomplete effect
  // below does NOT depend on them. Without this, parents that pass inline
  // arrow functions (every admin modal does) produce new callback
  // references on every render, which destroyed and reattached the
  // Google widget on every keystroke — breaking the dropdown.
  const onSelectRef = useRef(onSelect);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onChangeRef.current = onChange;
  }, [onSelect, onChange]);

  // Load Google Maps JS API on first mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await getApiKey();
        if (!key || cancelled) {
          if (!cancelled) setFallback(true);
          return;
        }
        await loadGoogleMaps(key);
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setFallback(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Attach Google Autocomplete to the input once the API is loaded.
  // Deps are [ready, region] only — callbacks come from refs above.
  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: region },
      fields: ['formatted_address', 'name'],
      types: ['address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const address = place?.formatted_address || place?.name || '';
      if (address) {
        skipNextChange.current = true;
        if (onSelectRef.current) onSelectRef.current(address);
        else if (onChangeRef.current) onChangeRef.current(address);
      }
    });

    autocompleteRef.current = autocomplete;

    // Style the Google dropdown to sit above everything (z-index)
    // Google's .pac-container is appended to document.body
    const style = document.createElement('style');
    style.textContent = '.pac-container { z-index: 999999 !important; }';
    document.head.appendChild(style);

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [ready, region]);

  // Fallback: use the old backend-proxy approach if Google Maps JS fails to load
  const [suggestions, setSuggestions] = useState([]);
  const [showFallback, setShowFallback] = useState(false);
  const debounceRef = useRef(null);

  const fetchFallbackSuggestions = useCallback((text) => {
    clearTimeout(debounceRef.current);
    if (!text || text.length < 3) {
      setSuggestions([]);
      setShowFallback(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const resp = await axios.get(`${API}/places/autocomplete`, {
          params: { input: text, region },
        });
        const preds = resp.data.predictions || [];
        setSuggestions(preds);
        setShowFallback(preds.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [region]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (onChange) onChange(val);
    if (fallback) fetchFallbackSuggestions(val);
  };

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
      {/* Fallback dropdown (only if Google Maps JS failed to load) */}
      {fallback && showFallback && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto z-[99999]">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setShowFallback(false);
                setSuggestions([]);
                if (onSelect) onSelect(s.description);
                else if (onChange) onChange(s.description);
              }}
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
