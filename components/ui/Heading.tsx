import { PropsWithChildren } from "react";

interface HeadingProps {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: 12 | 14 | 16 | 18 | 20 | 22 | 24 | 30 | 36 | 60 | 72 | 96 | 128;
  className?: string;
}

const Heading = ({
  as: heading,
  size,
  className = "",
  children,
}: PropsWithChildren<HeadingProps>) => {
  const getSize = (size: number) => {
    switch (size) {
      case 12:
        return "text-xs";
      case 14:
        return "text-sm";
      case 16:
        return "text-base";
      case 18:
        return "text-lg";
      case 20:
        return "text-xl";
      case 24:
        return "text-2xl";
      case 30:
        return "text-3xl";
      case 36:
        return "text-4xl";
      case 48:
        return "text-5xl";
      case 60:
        return "text-6xl";
      case 72:
        return "text-7xl";
      case 96:
        return "text-8xl";
      case 128:
        return "text-9xl";
      default:
        return "text-base";
    }
  };

  if (heading === "h1") {
    const defaultSize = 30;
    return (
      <h1
        className={`${
          size ? getSize(size) : getSize(defaultSize)
        } font-bold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h1>
    );
  }
  if (heading === "h2") {
    const defaultSize = 30;
    return (
      <h2
        className={`${
          size ? getSize(size) : getSize(defaultSize)
        } font-bold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h2>
    );
  }
  if (heading === "h3") {
    const defaultSize = 18;
    return (
      <h3
        className={`${
          size ? getSize(size) : getSize(defaultSize)
        } font-semibold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h3>
    );
  }
  if (heading === "h4") {
    const defaultSize = 16;
    return (
      <h4
        className={`${
          size ? getSize(size) : getSize(defaultSize)
        } font-semibold text-fog-of-war ${className}`}
      >
        {children}
      </h4>
    );
  }
  if (heading === "h5") {
    const defaultSize = 14;
    return (
      <h5
        className={`${
          size ? getSize(size) : getSize(defaultSize)
        } font-semibold text-fog-of-war ${className}`}
      >
        {children}
      </h5>
    );
  }
  if (heading === "h6") {
    const defaultSize = 14;
    return (
      <h6
        className={`${
          size ? getSize(size) : getSize(defaultSize)
        } font-bold text-fog-of-war ${className}`}
      >
        {children}
      </h6>
    );
  }
};

export default Heading;
