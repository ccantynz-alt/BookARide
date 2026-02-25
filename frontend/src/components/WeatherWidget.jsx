import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer } from 'lucide-react';

const WeatherWidget = ({ location = 'Auckland' }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated weather data for NZ locations
  const weatherData = {
    'Auckland': { temp: 22, condition: 'Partly Cloudy', humidity: 65, wind: 15, icon: 'cloud-sun' },
    'Auckland Airport': { temp: 21, condition: 'Clear', humidity: 60, wind: 18, icon: 'sun' },
    'Hamilton': { temp: 24, condition: 'Sunny', humidity: 55, wind: 10, icon: 'sun' },
    'Rotorua': { temp: 20, condition: 'Cloudy', humidity: 70, wind: 8, icon: 'cloud' },
    'Tauranga': { temp: 23, condition: 'Sunny', humidity: 62, wind: 12, icon: 'sun' },
    'Orewa': { temp: 21, condition: 'Partly Cloudy', humidity: 68, wind: 20, icon: 'cloud-sun' },
    'default': { temp: 20, condition: 'Partly Cloudy', humidity: 65, wind: 15, icon: 'cloud-sun' }
  };

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      const locationKey = Object.keys(weatherData).find(key => 
        location.toLowerCase().includes(key.toLowerCase())
      ) || 'default';
      
      // Add some randomness for realism
      const baseWeather = weatherData[locationKey];
      setWeather({
        ...baseWeather,
        temp: baseWeather.temp + Math.floor(Math.random() * 3) - 1,
        humidity: baseWeather.humidity + Math.floor(Math.random() * 10) - 5
      });
      setLoading(false);
    }, 500);
  }, [location]);

  const getWeatherIcon = (iconType) => {
    switch (iconType) {
      case 'sun': return <Sun className="w-10 h-10 text-yellow-500" />;
      case 'cloud': return <Cloud className="w-10 h-10 text-gray-400" />;
      case 'cloud-sun': return <Cloud className="w-10 h-10 text-blue-400" />;
      case 'rain': return <CloudRain className="w-10 h-10 text-blue-500" />;
      case 'snow': return <CloudSnow className="w-10 h-10 text-blue-200" />;
      default: return <Sun className="w-10 h-10 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200 animate-pulse">
        <div className="h-20 bg-sky-100 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <Thermometer className="w-5 h-5 text-sky-600" />
        <span className="font-semibold text-gray-800">Weather at Destination</span>
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-sky-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather?.icon)}
            <div>
              <p className="text-3xl font-bold text-gray-800">{weather?.temp}°C</p>
              <p className="text-sm text-gray-500">{weather?.condition}</p>
            </div>
          </div>
          
          <div className="text-right text-sm">
            <div className="flex items-center gap-1 text-gray-500">
              <Wind className="w-4 h-4" />
              <span>{weather?.wind} km/h</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 mt-1">
              <Cloud className="w-4 h-4" />
              <span>{weather?.humidity}% humidity</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            📍 {location || 'Auckland'} • Updated just now
          </p>
        </div>
      </div>
      
      <p className="text-[10px] text-gray-400 mt-2">
        💡 Tip: Pack layers for NZ weather - it can change quickly!
      </p>
    </motion.div>
  );
};

export default WeatherWidget;
