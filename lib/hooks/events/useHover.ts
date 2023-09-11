import { useState } from "react";

export const useHover = () => {
  const [hovered, setHovered] = useState(false);

  const onMouseEnter = () => {
    setHovered(true);
  };

  const onMouseLeave = () => {
    setHovered(false);
  };

  return {
    hovered,
    register: () => ({ onMouseEnter, onMouseLeave }),
  };
};
