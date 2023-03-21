import { PropsWithChildren } from "react";

type fontSize =
  | 12
  | 14
  | 16
  | 18
  | 20
  | 24
  | 28
  | 30
  | 36
  | 48
  | 60
  | 72
  | 96
  | 128;

interface HeadingProps {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: fontSize;
  className?: string;
}

const getSize = (size: fontSize) => {
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
    case 28:
      return "text-2.5xl";
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

const Heading = ({
  as: heading,
  size,
  className = "",
  children,
}: PropsWithChildren<HeadingProps>) => {
  if (heading === "h1") {
    const defaultSize = 28;
    return (
      <h1
        className={`${getSize(
          size ? size : defaultSize,
        )} font-bold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h1>
    );
  }
  if (heading === "h2") {
    const defaultSize = 28;
    return (
      <h2
        className={`${getSize(
          size ? size : defaultSize,
        )} font-bold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h2>
    );
  }
  if (heading === "h3") {
    const defaultSize = 18;
    return (
      <h3
        className={`${getSize(
          size ? size : defaultSize,
        )} font-semibold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h3>
    );
  }
  if (heading === "h4") {
    const defaultSize = 16;
    return (
      <h4
        className={`${getSize(
          size ? size : defaultSize,
        )} font-semibold text-fog-of-war ${className}`}
      >
        {children}
      </h4>
    );
  }
  if (heading === "h5") {
    const defaultSize = 14;
    return (
      <h5
        className={`${getSize(
          size ? size : defaultSize,
        )} font-semibold text-fog-of-war ${className}`}
      >
        {children}
      </h5>
    );
  }
  if (heading === "h6") {
    const defaultSize = 14;
    return (
      <h6
        className={`${getSize(
          size ? size : defaultSize,
        )} font-bold text-fog-of-war ${className}`}
      >
        {children}
      </h6>
    );
  }
};

export default Heading;
