import { FC, PropsWithChildren, ReactNode } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";

export type TooltipProps = PropsWithChildren<{
  content: ReactNode;
  icon?: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}>;

export const Tooltip: FC<TooltipProps> = ({
  content,
  icon,
  position = "top",
  children,
}) => {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
    left: "right-full top-1/2 -translate-y-1/2 mr-1",
    right: "left-full top-1/2 -translate-y-1/2 ml-1",
  };

  return (
    <div className="group relative inline-flex">
      <div className="cursor-help text-ztg-primary-500 transition-colors hover:text-ztg-primary-600">
        {children || icon || <AiOutlineInfoCircle className="h-3.5 w-3.5" />}
      </div>
      <div
        className={`pointer-events-none absolute z-50 w-64 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${positionClasses[position]}`}
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        <div className="rounded-md border-2 border-ztg-primary-200/30 bg-ztg-primary-900/95 px-3 py-2 text-xs leading-snug text-white shadow-lg backdrop-blur-md">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
