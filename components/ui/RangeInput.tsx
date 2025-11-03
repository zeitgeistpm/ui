import React, { useRef, useEffect } from "react";

export type RangeInputProps = {
  minLabel?: string;
  maxLabel?: string;
  valueSuffix?: string;
  onValueChange?: (val: string) => void;
  value?: number | string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  disabled?: boolean;
  className?: string;
  onFocus?: () => void;
  onChange?: (e: any) => void;
  onBlur?: (e: any) => void;
  name?: string;
  [key: string]: any;
};

const RangeInput = React.forwardRef<HTMLInputElement, RangeInputProps>(
  (props, ref) => {
    const {
      maxLabel,
      minLabel,
      valueSuffix = "",
      onValueChange,
      value = 0,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      className = "",
      onFocus,
      onChange,
      onBlur,
      name,
    } = props;

    const componentRef = useRef<HTMLDivElement | null>(null);

    // Parse values safely
    const parseValue = (val: number | string, defaultVal: number = 0): number => {
      if (typeof val === "number") return val;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? defaultVal : parsed;
    };

    const minNum = parseValue(min, 0);
    const maxNum = parseValue(max, 100);
    const stepNum = parseValue(step, 1);
    const valueNum = parseValue(value, 0);

    const rawPercentage = (maxNum - minNum) > 0 ? (valueNum - minNum) / (maxNum - minNum) : 0;
    const percentage = Math.max(0, Math.min(1, rawPercentage));

    const width = componentRef?.current?.clientWidth ?? 0;

    const minVisible = percentage > 0.1;
    const maxVisible = percentage < 0.9;

    // Update CSS custom property for track fill
    useEffect(() => {
      if (componentRef.current) {
        componentRef.current.style.setProperty('--track-fill', `${percentage * 100}%`);
      }
    }, [percentage]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);

      // Call custom onValueChange if provided
      if (onValueChange) {
        onValueChange(val.toString());
      }

      // Call react-hook-form onChange if provided
      if (onChange) {
        onChange(e);
      }

      // Update track fill immediately on change
      if (componentRef.current) {
        const newValue = parseFloat(e.target.value);
        const newPercentage = (maxNum - minNum) > 0 
          ? Math.max(0, Math.min(1, (newValue - minNum) / (maxNum - minNum)))
          : 0;
        componentRef.current.style.setProperty('--track-fill', `${newPercentage * 100}%`);
      }
    };

    return (
      <div
        className={`ztg-glass-slider relative w-full ${className}`}
        ref={componentRef}
        style={{ '--track-fill': `${percentage * 100}%` } as React.CSSProperties}
      >
        {/* Native input styled with glass morphism */}
        <div className="h-[20px] flex items-center" style={{ position: 'relative', zIndex: 10 }}>
          <input
            ref={ref}
            type="range"
            min={minNum}
            max={maxNum}
            step={stepNum}
            value={valueNum}
            onChange={handleChange}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled}
            name={name}
            className="ztg-range-input w-full"
          />
        </div>

        {/* Labels */}
        <div className="w-full justify-between">
          <div
            className="text-ztg-14-150 text-white/90"
            style={{
              left: `${percentage * (width - 40)}px`,
              width: "100px",
              position: "absolute",
              overflow: "hidden",
            }}
          >
            {valueNum} {valueSuffix}
          </div>
          <div className="mt-[8px] flex w-full justify-between">
            <div className="text-ztg-14-150 text-white/70">
              {minVisible ? minLabel : ""}
            </div>
            <div className="text-ztg-14-150 text-white/70">
              {maxVisible ? maxLabel : ""}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

RangeInput.displayName = "RangeInput";

export default RangeInput;
