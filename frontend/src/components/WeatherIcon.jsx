import React from 'react';
import { Sun, CloudSun, CloudRain, CloudLightning, Wind, Thermometer } from 'lucide-react';

const ICONS = {
  sunny: { Icon: Sun, tone: 'text-llanos-accent', spin: true },
  storm: { Icon: CloudLightning, tone: 'text-violet-500', pulse: true },
  rain: { Icon: CloudRain, tone: 'text-sky-500', bounce: true },
  windy: { Icon: Wind, tone: 'text-teal-500' },
  cold: { Icon: Thermometer, tone: 'text-indigo-400' },
  partly_cloudy: { Icon: CloudSun, tone: 'text-llanos-accent' },
};

/** Icono del clima. `onDark` lo pinta de blanco (para la tarjeta principal). */
export default function WeatherIcon({ condition, className = 'h-6 w-6', animated = false, onDark = false }) {
  const { Icon, tone, spin, pulse, bounce } = ICONS[condition] || ICONS.partly_cloudy;
  const motion = animated ? (spin ? 'animate-spin-slow' : pulse ? 'animate-pulse' : bounce ? 'animate-bounce-subtle' : '') : '';
  return <Icon aria-hidden="true" className={`${className} ${onDark ? 'text-white' : tone} ${motion}`} strokeWidth={1.8} />;
}
