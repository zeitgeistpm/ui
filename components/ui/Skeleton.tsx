import React from "react";
import { BeatLoader } from "react-spinners";

export type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "dots" | "pulse";
};

const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  variant = "pulse", // Default to traditional skeleton
}) => {
  width = typeof width === "number" ? `${width}px` : width;
  height = typeof height === "number" ? `${height}px` : height;

  if (variant === "dots") {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-sky-200/30 bg-white/80 p-3 shadow-sm backdrop-blur-md ${className}`}
        style={{ width, height: height || "auto" }}
      >
        <BeatLoader
          color="#0ea5e9"
          size={8}
          margin={4}
          speedMultiplier={0.8}
        />
      </div>
    );
  }

  // Traditional skeleton placeholder (default)
  return (
    <div
      className={"h-4 w-full animate-pulse rounded bg-gray-300 " + className}
      style={{ width, height }}
    ></div>
  );
};

export default Skeleton;
