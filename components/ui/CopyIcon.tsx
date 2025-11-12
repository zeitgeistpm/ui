import { Transition } from "@headlessui/react";
import { FC, Fragment, useEffect, useState } from "react";
import { Copy } from "react-feather";

export type CopyIconProps = {
  copyText?: string;
  className?: string;
  size?: number;
};

const CopyIcon: FC<CopyIconProps> = ({
  copyText,
  className = "",
  size = 20,
}) => {
  const [recentlyCopied, setRecentlyCopied] = useState(false);

  const copyAddressToClipboard = () => {
    if (copyText == null) {
      return;
    }
    navigator.clipboard.writeText(copyText);
    setRecentlyCopied(true);
  };

  const handleCopy = (event) => {
    event.stopPropagation();
    copyAddressToClipboard();
  };

  useEffect(() => {
    let ref;
    if (recentlyCopied) {
      ref = setTimeout(() => {
        setRecentlyCopied(false);
      }, 1000);
    }
    return () => clearTimeout(ref);
  }, [recentlyCopied]);

  return (
    <div className={"relative flex items-center " + className}>
      <Copy
        size={size}
        role="button"
        className="ml-auto cursor-pointer"
        onClick={handleCopy}
      />
      <Transition
        as={Fragment}
        show={recentlyCopied}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 :scale-95"
      >
        <div className="absolute right-0 top-[50%] translate-x-[100%] translate-y-[-50%] pl-2">
          <div className="rounded-md bg-black p-1 text-sm text-white/90">
            Copied!
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default CopyIcon;
