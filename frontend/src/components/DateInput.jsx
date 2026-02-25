import React, { forwardRef } from 'react';
import { Input } from './ui/input';

const DateInput = forwardRef(({ value, onChange, min, max, ...props }, ref) => {
  // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY for display
  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Convert DD/MM/YYYY to ISO date (YYYY-MM-DD) for storage
  const formatDateForStorage = (displayDate) => {
    if (!displayDate) return '';
    const parts = displayDate.replace(/\D/g, ''); // Remove non-digits
    if (parts.length < 6) return '';
    
    const day = parts.slice(0, 2);
    const month = parts.slice(2, 4);
    const year = parts.slice(4, 8);
    
    // Validate
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) return '';
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    let input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Auto-format as user types
    if (input.length >= 2) {
      input = input.slice(0, 2) + '/' + input.slice(2);
    }
    if (input.length >= 5) {
      input = input.slice(0, 5) + '/' + input.slice(5, 9);
    }
    
    // Update display
    e.target.value = input;
    
    // Convert to ISO and trigger onChange
    if (input.length === 10) {
      const isoDate = formatDateForStorage(input);
      if (isoDate) {
        onChange({ ...e, target: { ...e.target, name: props.name, value: isoDate } });
      }
    } else if (input.length === 0) {
      onChange({ ...e, target: { ...e.target, name: props.name, value: '' } });
    }
  };

  const displayValue = value ? formatDateForDisplay(value) : '';

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      defaultValue={displayValue}
      onChange={handleInputChange}
      placeholder="DD/MM/YYYY"
      maxLength={10}
    />
  );
});

DateInput.displayName = 'DateInput';

export default DateInput;
