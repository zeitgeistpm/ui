import React, { CSSProperties } from "react";

interface SimpleImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
  fill?: boolean;
}

/**
 * Simple img element wrapper that avoids Next.js Image fetchPriority warnings
 * Use this for small images like market card thumbnails
 */
const SimpleImage: React.FC<SimpleImageProps> = ({
  src,
  alt,
  className = "",
  style = {},
  fill = false,
}) => {
  const imgStyle: CSSProperties = fill
    ? {
        position: "absolute",
        height: "100%",
        width: "100%",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        objectFit: "cover",
        objectPosition: "center",
        ...style,
      }
    : style;

  // Use React.createElement to avoid any potential conflicts
  return React.createElement("img", {
    src,
    alt,
    className,
    style: imgStyle,
  });
};

export default SimpleImage;