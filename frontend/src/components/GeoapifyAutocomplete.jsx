import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './ui/input';

const GEOAPIFY_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

/**
 * Address autocomplete using Geoapify (no Google Maps required).
 * Set REACT_APP_GEOAPIFY_API_KEY in your environment.
 */
export const GeoapifyAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing address...',
  className = '',
  id,
  name,
  required = false,
  disabled = false,
  ...inputProps
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2 || !GEOAPIFY_KEY) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_KEY}&limit=5&filter=countrycode:nz`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowDropdown(true);
    } catch (err) {
      console.error('Geoapify autocomplete error:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const v = e.target.value;
    onChange?.(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 250);
    setShowDropdown(true);
  };

  const handleSelect = (feature) => {
    const addr = feature.properties?.formatted || feature.properties?.address_line1 || '';
    onChange?.(addr);
    onSelect?.(addr, feature);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className={className}
        {...inputProps}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul
          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto"
          style={{ top: '100%' }}
        >
          {suggestions.map((f, i) => (
            <li
              key={f.properties?.place_id || i}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-800"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(f);
              }}
            >
              {f.properties?.formatted || f.properties?.address_line1 || 'Address'}
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
          ...
        </div>
      )}
    </div>
  );
};

export default GeoapifyAutocomplete;
