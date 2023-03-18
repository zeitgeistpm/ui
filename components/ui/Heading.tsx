import { PropsWithChildren } from "react";

type fontSize =
  | 12
  | 14
  | 16
  | 18
  | 20
  | 22
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
  xl?: fontSize;
  lg?: fontSize;
  md?: fontSize;
  sm?: fontSize;
  className?: string;
}

const Heading = ({
  as: heading,
  xl,
  lg,
  md,
  sm,
  className = "",
  children,
}: PropsWithChildren<HeadingProps>) => {
  const getPrefix = (size: fontSize, prefix: string) => {
    return `${prefix}${getSize(size)}`;
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

  const extraLarge = xl && getSize(xl);
  const large = lg && getPrefix(lg, "lg:");
  const medium = md && getPrefix(md, "md:");
  const small = sm && getPrefix(sm, "sm:");

  if (heading === "h1") {
    const defaultSize = 28;
    return (
      <h1
        className={`${
          extraLarge ? extraLarge : getSize(defaultSize)
        } ${small} ${medium} ${large} font-bold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h1>
    );
  }
  if (heading === "h2") {
    const defaultSize = 28;
    console.log(small);
    return (
      <h2
        className={`${extraLarge ? extraLarge : getSize(defaultSize)} ${
          sm && getPrefix(sm, "sm:")
        } ${md && getPrefix(md, "md:")} ${
          lg && getPrefix(lg, "lg:")
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
          extraLarge ? extraLarge : getSize(defaultSize)
        } ${large} ${medium} ${small} font-semibold text-fog-of-war mb-4 ${className}`}
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
          extraLarge ? extraLarge : getSize(defaultSize)
        } ${large} ${medium} ${small}  font-semibold text-fog-of-war ${className}`}
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
          extraLarge ? extraLarge : getSize(defaultSize)
        } ${large} ${medium} ${small}  font-semibold text-fog-of-war ${className}`}
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
          extraLarge ? extraLarge : getSize(defaultSize)
        } ${large} ${medium} ${small}  font-bold text-fog-of-war ${className}`}
      >
        {children}
      </h6>
    );
  }
};

export default Heading;
