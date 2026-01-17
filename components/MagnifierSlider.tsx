'use client';

import { useState, useRef, useEffect } from 'react';

interface MagnifierSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  color?: string;
  subLabel?: string;
}

export default function MagnifierSlider({
  min,
  max,
  step,
  value,
  onChange,
  label,
  unit = '',
  color = '#ffffff',
  subLabel,
}: MagnifierSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [thumbPosition, setThumbPosition] = useState(0);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Calculate thumb position as percentage
  useEffect(() => {
    const percent = ((value - min) / (max - min)) * 100;
    setThumbPosition(percent);
  }, [value, min, max]);

  const handleInteractionStart = () => {
    setIsDragging(true);
  };

  const handleInteractionEnd = () => {
    setIsDragging(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="relative w-full py-2">
      {/* Magnifier bubble - appears when dragging */}
      <div
        className={`
          absolute -top-24 z-50
          transition-all duration-150 ease-out
          ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
        `}
        style={{
          left: `${thumbPosition}%`,
          transform: `translateX(-50%)`,
        }}
      >
        {/* Glass container */}
        <div className="relative">
          {/* Main bubble */}
          <div
            className="
              relative
              px-5 py-3
              rounded-2xl
              border border-white/20
              shadow-2xl
              min-w-[100px]
              text-center
            "
            style={{
              background: 'rgba(30, 30, 30, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                0 0 40px ${color}22
              `,
            }}
          >
            {/* Top glass reflection */}
            <div
              className="
                absolute top-0 left-[10%] right-[10%] h-[45%]
                rounded-t-2xl
                pointer-events-none
              "
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
              }}
            />

            {/* Value display */}
            <div className="relative z-10">
              <span
                className="text-4xl font-bold tracking-tight"
                style={{
                  color: color,
                  textShadow: `0 0 20px ${color}66`,
                }}
              >
                {value}
              </span>
              {unit && (
                <span className="text-lg text-gray-400 ml-1">{unit}</span>
              )}
              {subLabel && (
                <div
                  className="text-xs font-medium mt-0.5"
                  style={{ color: color }}
                >
                  {subLabel}
                </div>
              )}
            </div>
          </div>

          {/* Pointer/stem triangle */}
          <div className="flex justify-center -mt-[1px]">
            <div
              className="w-4 h-4 rotate-45 border-r border-b border-white/20"
              style={{
                background: 'rgba(30, 30, 30, 0.85)',
                marginTop: '-8px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Static value display when not dragging */}
      <div
        className={`
          text-center mb-3 transition-opacity duration-150
          ${isDragging ? 'opacity-30' : 'opacity-100'}
        `}
      >
        <span
          className="text-3xl font-bold"
          style={{ color: color }}
        >
          {value}
        </span>
        {unit && <span className="text-gray-500 text-base ml-1">{unit}</span>}
        {(label || subLabel) && (
          <div className="text-xs text-gray-500 mt-0.5">
            {subLabel || label}
          </div>
        )}
      </div>

      {/* Slider track */}
      <div className="relative">
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onMouseDown={handleInteractionStart}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchEnd={handleInteractionEnd}
          className="w-full magnifier-slider"
          style={{
            // @ts-ignore - CSS custom property
            '--slider-color': color,
          }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
