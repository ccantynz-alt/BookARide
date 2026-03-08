import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { MapPin } from 'lucide-react';
import { Input } from './ui/input';
import axios from 'axios';
import { API } from '../config/api';

/**
 * AddressAutocomplete
 *
 * A controlled address input that shows a Google Places autocomplete dropdown.
 * The dropdown is rendered via a React Portal so it is NEVER clipped by
 * overflow: hidden / overflow: auto on ancestor elements (e.g. Dialog scrollers).
 *
 * Props:
 *   value        – controlled string value
 *   onChange     – called with the new string when the user types
 *   onSelect     – called with the chosen address string when the user picks a suggestion
 *   placeholder  – input placeholder text
 *   id           – optional id for the <input>
 *   required     – optional boolean
 *   disabled     – optional boolean
 *   className    – extra classes on the <input>
 *   region       – Google Places region code (default "nz")
 */
const AddressAutocomplete = ({
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
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);
  // Incremented on every selection to discard in-flight responses that arrive after.
  const fetchGenRef = useRef(0);

  const fetchSuggestions = useCallback(
    (text) => {
      clearTimeout(debounceRef.current);
      if (!text || text.length < 3) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      const gen = ++fetchGenRef.current;
      debounceRef.current = setTimeout(async () => {
        try {
          const resp = await axios.get(`${API}/places/autocomplete`, {
            params: { input: text, types: 'address', region },
          });
          // Ignore if a selection happened while the request was in-flight
          if (gen !== fetchGenRef.current) return;
          const preds = resp.data.predictions || [];
          setSuggestions(preds);
          setOpen(preds.length > 0);
        } catch (err) {
          console.error('[AddressAutocomplete] error:', err.message);
        }
      }, 300);
    },
    [region]
  );

  // Recalculate dropdown position whenever it opens or window resizes/scrolls.
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const handleSelect = (description) => {
    clearTimeout(debounceRef.current);  // cancel pending debounce
    fetchGenRef.current++;              // invalidate any in-flight request
    setOpen(false);
    setSuggestions([]);
    if (onSelect) onSelect(description);
    else if (onChange) onChange(description);
  };

  // Close when clicking outside (exclude the portal dropdown itself).
  // Uses CAPTURING phase so we see the event before any stopPropagation in bubbling.
  useEffect(() => {
    const handler = (e) => {
      // If the click target is inside the dropdown, do nothing
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      // If the click target is inside the input, do nothing
      if (inputRef.current && inputRef.current.contains(e.target)) return;
      setOpen(false);
    };
    // Use capture phase so this runs reliably regardless of stopPropagation in bubbling
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, []);

  const dropdown =
    open && suggestions.length > 0
      ? ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            data-autocomplete-dropdown=""
            className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();  // keep focus on input
                  e.stopPropagation(); // prevent Radix Dialog from intercepting
                  handleSelect(s.description);
                }}
                onMouseDown={(e) => {
                  // Fallback for environments where pointerdown doesn't fire (e.g. jsdom tests).
                  // In real browsers pointerdown fires first and handleSelect closes the dropdown
                  // before mousedown fires, so this is effectively a no-op in production.
                  e.preventDefault();
                  e.stopPropagation();
                  if (open) handleSelect(s.description);
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-0"
              >
                <MapPin className="w-3 h-3 inline mr-2 text-gray-400" />
                {s.description}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => {
          if (onChange) onChange(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            updatePosition();
            setOpen(true);
          }
        }}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className={`transition-all duration-200 focus:ring-2 focus:ring-gold ${className}`}
      />
      {dropdown}
    </>
  );
};

export default AddressAutocomplete;
