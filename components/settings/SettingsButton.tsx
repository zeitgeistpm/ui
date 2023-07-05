import React from "react";
import { Settings } from "react-feather";
import SettingsModal from "./SettingsModal";

type SettingsButtonProps = {
  className?: string;
};

const SettingsButton: React.FC<SettingsButtonProps> = ({ className = "" }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div
        className={"flex items-center px-6 mb-3 cursor-pointer " + className}
        onClick={() => setOpen(true)}
      >
        <Settings />
        <button
          className={`group flex w-full items-center rounded-md px-2 py-2 text-sm font-semibold`}
        >
          Settings
        </button>
      </div>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default SettingsButton;
