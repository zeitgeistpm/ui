import React from "react";

export type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
};

const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
}) => {
  width = typeof width === "number" ? `${width}px` : width;
  height = typeof height === "number" ? `${height}px` : height;
  return (
    <div
      className={"animate-pulse bg-gray-300 rounded w-full h-4 " + className}
      style={{ width, height }}
    ></div>
  );
};

export default Skeleton;
