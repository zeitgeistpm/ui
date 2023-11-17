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
      className={"h-4 w-full animate-pulse rounded bg-gray-300 " + className}
      style={{ width, height }}
    ></div>
  );
};

export default Skeleton;
