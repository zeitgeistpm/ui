import { MarketType } from "lib/types/market-filter";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Grid, Layers } from "react-feather";

export interface MarketTypeToggleProps {
  value: MarketType;
  onChange: (type: MarketType) => void;
}

const MarketTypeToggle = ({ value, onChange }: MarketTypeToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (type: MarketType) => {
    onChange(type);
    setIsOpen(false);
  };

  const displayText = value === "regular" ? "Markets" : "Multi-Markets";
  const Icon = value === "regular" ? Grid : Layers;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-xs font-semibold transition-all lg:gap-1.5 lg:px-2.5 ${
          isOpen
            ? "bg-sky-100 text-sky-800"
            : "text-sky-800 hover:bg-sky-50 hover:text-sky-800"
        }`}
      >
        <Icon size={13} />
        <span>{displayText}</span>
        <ChevronDown
          size={13}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg">
          <button
            onClick={() => handleSelect("regular")}
            className={`flex w-full items-center gap-1.5 rounded-t-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              value === "regular"
                ? "bg-sky-600 text-white"
                : "text-sky-800 hover:bg-sky-50"
            }`}
          >
            <Grid size={13} />
            <span>Markets</span>
          </button>
          <button
            onClick={() => handleSelect("multi")}
            className={`flex w-full items-center gap-1.5 rounded-b-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              value === "multi"
                ? "bg-sky-600 text-white"
                : "text-sky-800 hover:bg-sky-50"
            }`}
          >
            <Layers size={13} />
            <span>Multi-Markets</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketTypeToggle;
