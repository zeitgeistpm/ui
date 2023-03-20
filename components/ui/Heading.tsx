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
  xxl?: fontSize;
  xl?: fontSize;
  lg?: fontSize;
  md?: fontSize;
  sm?: fontSize;
  className?: string;
}

const Heading = ({
  as: heading,
  size,
  xxl,
  xl,
  lg,
  md,
  sm,
  className = "",
  children,
}: PropsWithChildren<HeadingProps>) => {
  const getSmallSize = (size: fontSize) => {
    switch (size) {
      case 12:
        return "sm:text-xs";
      case 14:
        return "sm:text-sm";
      case 16:
        return "sm:text-base";
      case 18:
        return "sm:text-lg";
      case 20:
        return "sm:text-xl";
      case 24:
        return "sm:text-2xl";
      case 28:
        return "sm:text-2.5xl";
      case 30:
        return "sm:text-3xl";
      case 36:
        return "sm:text-4xl";
      case 48:
        return "sm:text-5xl";
      case 60:
        return "sm:text-6xl";
      case 72:
        return "sm:text-7xl";
      case 96:
        return "sm:text-8xl";
      case 128:
        return "sm:text-9xl";
      default:
        return "";
    }
  };
  const getMediumSize = (size: fontSize) => {
    switch (size) {
      case 12:
        return "md:text-xs";
      case 14:
        return "md:text-sm";
      case 16:
        return "md:text-base";
      case 18:
        return "md:text-lg";
      case 20:
        return "md:text-xl";
      case 24:
        return "md:text-2xl";
      case 28:
        return "md:text-2.5xl";
      case 30:
        return "md:text-3xl";
      case 36:
        return "md:text-4xl";
      case 48:
        return "md:text-5xl";
      case 60:
        return "md:text-6xl";
      case 72:
        return "md:text-7xl";
      case 96:
        return "md:text-8xl";
      case 128:
        return "md:text-9xl";
      default:
        return "";
    }
  };
  const getLargeSize = (size: fontSize) => {
    switch (size) {
      case 12:
        return "lg:text-xs";
      case 14:
        return "lg:text-sm";
      case 16:
        return "lg:text-base";
      case 18:
        return "lg:text-lg";
      case 20:
        return "lg:text-xl";
      case 24:
        return "lg:text-2xl";
      case 28:
        return "lg:text-2.5xl";
      case 30:
        return "lg:text-3xl";
      case 36:
        return "lg:text-4xl";
      case 48:
        return "lg:text-5xl";
      case 60:
        return "lg:text-6xl";
      case 72:
        return "lg:text-7xl";
      case 96:
        return "lg:text-8xl";
      case 128:
        return "lg:text-9xl";
      default:
        return "";
    }
  };

  const getXLSize = (size: fontSize) => {
    switch (size) {
      case 12:
        return "xl:text-xs";
      case 14:
        return "xl:text-sm";
      case 16:
        return "xl:text-base";
      case 18:
        return "xl:text-lg";
      case 20:
        return "xl:text-xl";
      case 24:
        return "xl:text-2xl";
      case 28:
        return "xl:text-2.5xl";
      case 30:
        return "xl:text-3xl";
      case 36:
        return "xl:text-4xl";
      case 48:
        return "xl:text-5xl";
      case 60:
        return "xl:text-6xl";
      case 72:
        return "xl:text-7xl";
      case 96:
        return "xl:text-8xl";
      case 128:
        return "xl:text-9xl";
      default:
        return "";
    }
  };

  const get2XLSize = (size: fontSize) => {
    switch (size) {
      case 12:
        return "2xl:text-xs";
      case 14:
        return "2xl:text-sm";
      case 16:
        return "2xl:text-base";
      case 18:
        return "2xl:text-lg";
      case 20:
        return "2xl:text-xl";
      case 24:
        return "2xl:text-2xl";
      case 28:
        return "2xl:text-2.5xl";
      case 30:
        return "2xl:text-3xl";
      case 36:
        return "2xl:text-4xl";
      case 48:
        return "2xl:text-5xl";
      case 60:
        return "2xl:text-6xl";
      case 72:
        return "2xl:text-7xl";
      case 96:
        return "2xl:text-8xl";
      case 128:
        return "2xl:text-9xl";
      default:
        return "";
    }
  };

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

  const sizes = `${getSmallSize(sm).trim()} ${getMediumSize(
    md,
  ).trim()} ${getLargeSize(lg).trim()} ${getXLSize(xl).trim()} ${get2XLSize(
    xxl,
  ).trim()}`;

  if (heading === "h1") {
    const defaultSize = 28;
    return (
      <h1
        className={`${getSize(
          size ? size : defaultSize,
        )} ${sizes} font-bold text-fog-of-war mb-4 ${className}`}
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
        )} ${sizes} font-bold text-fog-of-war mb-4 ${className}`}
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
        )} ${sizes} font-semibold text-fog-of-war mb-4 ${className}`}
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
        )} ${sizes} font-semibold text-fog-of-war ${className}`}
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
        )} ${sizes} font-semibold text-fog-of-war ${className}`}
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
        )} ${sizes} font-bold text-fog-of-war ${className}`}
      >
        {children}
      </h6>
    );
  }
};

export default Heading;
