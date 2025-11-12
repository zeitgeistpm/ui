import { Dialog } from "@headlessui/react";
import { ReactNode } from "react";

export interface ModalPanelProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl"; // Simplified to 4 standard sizes
  variant?: "default" | "compact"; // Spacing variants
}

// Standardized sizing system for consistency
// Using explicit width with max-width fallback to prevent resizing when switching tabs
// Capped at 600px max-width to prevent modals from being too wide on large screens
const sizeClasses = {
  sm: "w-[min(420px,90vw)] max-w-[600px]",   // Confirmations, simple dialogs
  md: "w-[min(560px,90vw)] max-w-[600px]",   // Standard forms, settings
  lg: "w-[min(680px,92vw)] max-w-[600px]",   // Complex forms, multi-column
  xl: "w-[min(800px,95vw)] max-w-[600px]",   // Large interfaces, liquidity management
};

// Standard height for all modals (can be overridden with className if needed)
const standardHeight = "max-h-[85vh] md:max-h-[80vh]";

// Padding variants
const paddingClasses = {
  default: "p-6 md:p-8", // Standard padding
  compact: "p-4 md:p-6", // Compact padding for dense content
};

export const ModalPanel = ({
  children,
  className = "",
  size = "md",
  variant = "default",
}: ModalPanelProps) => {
  // Base classes with improved styling and spacing
  // Added min-w-0 and flex-shrink-0 to prevent content from forcing expansion/shrinkage
  const baseClasses = `
    relative
    flex flex-col
    min-w-0
    flex-shrink-0
    flex-grow-0
    rounded-xl
    border-2 border-white/10
    bg-white/10
    shadow-2xl
    backdrop-blur-xl
    ring-2 ring-white/5
    overflow-hidden
  `;

  const sizeClass = sizeClasses[size];

  return (
    <Dialog.Panel
      className={`
        ${baseClasses}
        ${sizeClass}
        ${standardHeight}
        ${className}
      `}
    >
      {children}
    </Dialog.Panel>
  );
};

// Standard modal header component for consistency
// Reduced sizes to match rest of UI
// Improved spacing for better visual separation
export const ModalHeader = ({
  title,
  children,
  className = ""
}: {
  title?: string;
  children?: ReactNode;
  className?: string;
}) => (
  <div className={`flex-shrink-0 px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-3 ${className}`}>
    {title && (
      <h2 className="text-lg md:text-xl font-bold text-white/90 text-center mb-0">
        {title}
      </h2>
    )}
    {children}
  </div>
);

// Standard modal body component with scrolling
// Added min-w-0 to prevent content from forcing expansion and min-h-0 for flex sizing
// Reduced padding to match rest of UI, added top padding for better spacing with tabs
export const ModalBody = ({
  children,
  className = "",
  noPadding = false
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) => (
  <div className={`
    flex-1
    min-w-0
    min-h-0
    overflow-y-auto
    modal-scrollable
    ${noPadding ? '' : 'px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-6'}
    ${className}
  `}>
    {children}
  </div>
);

// Standard modal tabs component for consistency
// Reduced height to match standard UI tabs
export const ModalTabs = ({
  tabs,
  className = ""
}: {
  tabs: ReactNode;
  className?: string;
}) => (
  <div className={`
    flex-shrink-0
    h-11 md:h-12
    border-b-2 border-white/10
    ${className}
  `}>
    {tabs}
  </div>
);

// Standard tab button styling for modals
// Reduced sizes to match standard UI tabs
export const modalTabStyles = {
  base: "flex-1 px-3 py-2 text-sm font-medium transition-all",
  inactive: "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90",
  active: "bg-white/10 text-white/90 font-semibold shadow-sm",
};
