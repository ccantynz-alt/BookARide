import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, Clock } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

// Custom input component for date picker
const CustomDateInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <div 
    className="flex items-center w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-gold transition-colors bg-white"
    onClick={onClick}
    ref={ref}
  >
    <Calendar className="w-5 h-5 text-gray-500 mr-2" />
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      readOnly
      className="flex-1 outline-none cursor-pointer bg-transparent"
    />
  </div>
));

CustomDateInput.displayName = 'CustomDateInput';

// Custom input component for time picker
const CustomTimeInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <div 
    className="flex items-center w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:border-gold transition-colors bg-white"
    onClick={onClick}
    ref={ref}
  >
    <Clock className="w-5 h-5 text-gray-500 mr-2" />
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      readOnly
      className="flex-1 outline-none cursor-pointer bg-transparent"
    />
  </div>
));

CustomTimeInput.displayName = 'CustomTimeInput';

// Custom Date Picker Component
export const CustomDatePicker = ({ selected, onChange, placeholder = "Select date", minDate, ...props }) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="dd/MM/yyyy"
      minDate={minDate || new Date()}
      customInput={<CustomDateInput placeholder={placeholder} />}
      calendarClassName="custom-calendar"
      popperClassName="custom-popper"
      showPopperArrow={false}
      {...props}
    />
  );
};

// Custom Time Picker Component
export const CustomTimePicker = ({ selected, onChange, placeholder = "Select time", ...props }) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      showTimeSelectOnly
      timeIntervals={15}
      timeCaption="Time"
      dateFormat="h:mm aa"
      customInput={<CustomTimeInput placeholder={placeholder} />}
      calendarClassName="custom-time-picker"
      popperClassName="custom-popper"
      showPopperArrow={false}
      {...props}
    />
  );
};

// Combined Date & Time Picker Component
export const CustomDateTimePicker = ({ selected, onChange, placeholder = "Select date & time", minDate, ...props }) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      timeFormat="h:mm aa"
      timeIntervals={15}
      dateFormat="dd/MM/yyyy h:mm aa"
      minDate={minDate || new Date()}
      customInput={<CustomDateInput placeholder={placeholder} />}
      calendarClassName="custom-calendar"
      popperClassName="custom-popper"
      showPopperArrow={false}
      {...props}
    />
  );
};
