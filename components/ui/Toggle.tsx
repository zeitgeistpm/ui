import { Switch } from "@headlessui/react";

export const Toggle = ({
  className,
  checked,
  onChange,
  disabled,
  activeClassName,
  deActiveClassName,
}: {
  className?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  activeClassName?: string;
  deActiveClassName?: string;
}) => {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={`
        relative inline-flex box-content p-[2px] h-3 w-16 shrink-0 cursor-pointer 
        rounded-full border-2 border-transparent transition-all duration-200 ease-in-out 
        focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75 active:scale-105
        ${disabled && "!bg-gray-400 !cursor-not-allowed"}
        ${
          checked
            ? activeClassName ?? "bg-black"
            : deActiveClassName ?? "bg-black"
        }
        ${className}`}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`
            ${checked ? "translate-x-12" : "translate-x-1"}
            pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white 
            shadow-lg ring-0 transition duration-150 ease-[cubic-bezier(.51,.44,.4,1.35)]`}
      />
    </Switch>
  );
};

export default Toggle;
