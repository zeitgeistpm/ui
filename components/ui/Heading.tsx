import { PropsWithChildren } from "react";

interface HeadingProps {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: number;
  className?: string;
}

const Heading = ({
  as: heading,
  size,
  className,
  children,
}: PropsWithChildren<HeadingProps>) => {
  if (heading === "h1") {
    const defaultSize = 28;
    return (
      <h1
        className={`text-[${
          size ? size : defaultSize
        }px] font-bold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h1>
    );
  }
  if (heading === "h2") {
    const defaultSize = 28;
    return (
      <h2
        className={`text-[${
          size ? size : defaultSize
        }px] font-bold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h2>
    );
  }
  if (heading === "h3") {
    const defaultSize = 18;
    return (
      <h3
        className={`text-[${
          size ? size : defaultSize
        }px] font-semibold text-fog-of-war mb-4 ${className}`}
      >
        {children}
      </h3>
    );
  }
  if (heading === "h4") {
    const defaultSize = 16;
    return (
      <h4
        className={`text-[${
          size ? size : defaultSize
        }px] font-semibold text-fog-of-war ${className}`}
      >
        {children}
      </h4>
    );
  }
  if (heading === "h5") {
    const defaultSize = 14;
    return (
      <h5
        className={`text-[${
          size ? size : defaultSize
        }px] font-semibold text-fog-of-war ${className}`}
      >
        {children}
      </h5>
    );
  }
  if (heading === "h6") {
    const defaultSize = 14;
    return (
      <h6
        className={`text-[${
          size ? size : defaultSize
        }px] font-bold text-fog-of-war ${className}`}
      >
        {children}
      </h6>
    );
  }
};

export default Heading;
