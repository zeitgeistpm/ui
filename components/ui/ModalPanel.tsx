import { Dialog } from "@headlessui/react";
import { ReactNode } from "react";

export interface ModalPanelProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-[400px]",
  md: "max-w-[500px]",
  lg: "max-w-[520px]",
  xl: "max-w-[564px]",
  "2xl": "max-w-[600px]",
  full: "max-w-full",
};

export const ModalPanel = ({
  children,
  className = "",
  maxWidth = "md",
}: ModalPanelProps) => {
  const baseClasses =
    "w-full rounded-lg border-2 border-white/10 bg-white/10 shadow-xl backdrop-blur-lg ring-2 ring-white/5";
  const maxWidthClass = maxWidthClasses[maxWidth];

  return (
    <Dialog.Panel
      className={`${baseClasses} ${maxWidthClass} ${className}`}
    >
      {children}
    </Dialog.Panel>
  );
};
