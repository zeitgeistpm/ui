import { useState } from "react";
import { Switch } from "@headlessui/react";

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
}) => {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      className={`
        bg-black relative inline-flex box-content p-[2px] h-3 w-16 shrink-0 cursor-pointer 
        rounded-full border-2 border-transparent transition-all duration-200 ease-in-out 
        focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75 active:scale-105`}
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
