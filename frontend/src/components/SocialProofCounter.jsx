import React, { useState, useEffect } from 'react';

const MESSAGES = [
  { text: 'people viewing this route right now', min: 3, max: 8 },
  { text: 'bookings made today', min: 12, max: 34 },
  { text: 'rides completed this week', min: 85, max: 200 },
];

const URGENCY_MESSAGES = [
  'Popular time slot — book now to secure your ride',
  'Limited availability for airport transfers today',
  'High demand — confirm your booking soon',
];

export default function SocialProofCounter({ variant = 'default' }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const pick = () => {
      const i = Math.floor(Math.random() * MESSAGES.length);
      setMsgIndex(i);
      const { min, max } = MESSAGES[i];
      setCount(Math.floor(Math.random() * (max - min + 1)) + min);
    };
    pick();
    const interval = setInterval(pick, 8000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'urgency') {
    const urgencyMsg = URGENCY_MESSAGES[msgIndex % URGENCY_MESSAGES.length];
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <span>{urgencyMsg}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span>
        <strong>{count}</strong> {MESSAGES[msgIndex].text}
      </span>
    </div>
  );
}
