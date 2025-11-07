import { forwardRef, useRef, useEffect } from "react";

interface GlassSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number;
}

const GlassSlider = forwardRef<HTMLInputElement, GlassSliderProps>(
  ({ value, className = "", ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Update CSS variable for glass morphism track fill
    useEffect(() => {
      if (containerRef.current) {
        const percentValue = parseFloat(String(value || "0"));
        containerRef.current.style.setProperty(
          "--track-fill",
          String(percentValue),
        );
      }
    }, [value]);

    return (
      <div
        ref={containerRef}
        className={`ztg-glass-slider ${className}`}
        style={
          {
            "--track-fill": String(parseFloat(String(value || "0"))),
          } as React.CSSProperties
        }
      >
        <input
          ref={ref}
          type="range"
          className="ztg-range-input w-full"
          value={value}
          {...props}
        />
      </div>
    );
  },
);

GlassSlider.displayName = "GlassSlider";

export default GlassSlider;
