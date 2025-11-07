import React, { useEffect } from "react";

type InputProps = {} & React.InputHTMLAttributes<HTMLInputElement>;

const defaultClassName =
  "rounded-lg outline-none items-center text-white/90 placeholder:text-white/60 backdrop-blur-sm transition-all";

const Input = React.forwardRef<HTMLInputElement | null, InputProps>(
  (props, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const [focused, setFocused] = React.useState(false);

    const { className, ...restProps } = props;
    const isNumber = props.type === "number";

    useEffect(() => {
      if (!isNumber || !inputRef.current) {
        return;
      }

      const handleFocus = (e: FocusEvent) => {
        setFocused(true);
      };

      const handleBlur = (e: FocusEvent) => {
        setFocused(false);
      };

      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === "e") {
          e.preventDefault();
        }
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (["ArrowUp", "ArrowDown"].includes(e.key)) {
          e.preventDefault();
        }
      };

      inputRef.current.addEventListener("focus", handleFocus);
      inputRef.current.addEventListener("blur", handleBlur);
      inputRef.current.addEventListener("keypress", handleKeyPress);
      inputRef.current.addEventListener("keydown", onKeyDown);

      return () => {
        inputRef.current?.removeEventListener("focus", handleFocus);
        inputRef.current?.removeEventListener("blur", handleBlur);
        inputRef.current?.removeEventListener("keypress", handleKeyPress);
        inputRef.current?.removeEventListener("keydown", onKeyDown);
      };
    }, [isNumber, inputRef.current]);

    useEffect(() => {
      if (!(isNumber && inputRef.current && focused)) {
        return;
      }

      const disableWheel = (e: WheelEvent) => {
        e.preventDefault();
      };

      inputRef.current.addEventListener("wheel", disableWheel);

      return () => inputRef.current?.removeEventListener("wheel", disableWheel);
    }, [isNumber, inputRef.current, focused]);

    return (
      <input
        {...restProps}
        className={`${defaultClassName} ${className ?? ""}`}
        ref={(instance) => {
          inputRef.current = instance;
          if (typeof ref === "function") {
            ref(instance);
          } else if (ref) {
            ref.current = instance;
          }
        }}
      />
    );
  },
);

export default Input;
