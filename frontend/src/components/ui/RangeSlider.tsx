import React, { useState, useEffect } from "react";
import type { RangeSliderProps } from "../../types";

const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  unit,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-900">{label}</label>
        <div className="text-sm font-bold text-slate-900">
          {localValue.toLocaleString()}
          {unit && <span className="text-slate-600 ml-1">{unit}</span>}
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          style={{
            background: `linear-gradient(to right, rgb(6, 182, 212) 0%, rgb(6, 182, 212) ${percentage}%, rgb(226, 232, 240) ${percentage}%, rgb(226, 232, 240) 100%)`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default RangeSlider;
