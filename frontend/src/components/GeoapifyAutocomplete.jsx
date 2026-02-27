import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './ui/input';
import axios from 'axios';
import { API } from '../config/api';

const GEOAPIFY_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

/**
 * Address autocomplete using Geoapify (no Google Maps required).
 * Uses REACT_APP_GEOAPIFY_API_KEY if available; falls back to backend proxy.
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
  quickSelectOptions,
  ...inputProps
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      let results = [];
      if (GEOAPIFY_KEY) {
        // Direct Geoapify call
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_KEY}&limit=5&filter=countrycode:nz`
        );
        const data = await res.json();
        results = (data.features || []).map(f => ({
          id: f.properties?.place_id || Math.random().toString(),
          text: f.properties?.formatted || f.properties?.address_line1 || 'Address',
          feature: f,
        }));
      } else {
        // Backend proxy fallback
        const res = await axios.get(`${API}/places/autocomplete`, {
          params: { input: query, region: 'nz' },
        });
        results = (res.data.predictions || []).map((p, i) => ({
          id: p.place_id || i.toString(),
          text: p.description || p.formatted || 'Address',
        }));
      }
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } catch (err) {
      console.error('Autocomplete error:', err);
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

  const handleSelect = (item) => {
    onChange?.(item.text);
    onSelect?.(item.text, item.feature);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleQuickSelect = (addr) => {
    onChange?.(addr);
    onSelect?.(addr);
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
          {suggestions.map((item) => (
            <li
              key={item.id}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-800"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
            >
              {item.text}
            </li>
          ))}
        </ul>
      )}
      {quickSelectOptions && quickSelectOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {quickSelectOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleQuickSelect(opt.address);
              }}
              className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gold/20 hover:text-gold border border-gray-200 hover:border-gold/40 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
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
