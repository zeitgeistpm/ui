import { Dialog, Popover, Transition } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { Fragment, ReactNode, useMemo, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";

export type InfoPopoverProps = React.PropsWithChildren<{
  title?: ReactNode;
  icon?: ReactNode;
  className?: string;
  overlay?: boolean;
  position?:
    | "top"
    | "bottom"
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end";
}>;

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  title,
  icon,
  children,
  className,
  overlay = true,
  position = "bottom",
}) => {
  let [isOpen, setIsOpen] = useState(false);

  const positionCss = useMemo(() => {
    switch (position) {
      case "top":
        return "top-0 translate-y-[-100%] left-1/2 transform translate-x-[-50%]";
      case "bottom":
        return "top-[100%] left-1/2 transform translate-x-[-50%]";
      case "top-start":
        return "top-0 translate-y-[-100%] translate-x-[-100%] left-0";
      case "top-end":
        return "top-0 translate-y-[-100%]  left-0";
      case "bottom-start":
        return "top-[100%] right-0";
      case "bottom-end":
        return "top-[100%] left-0";
    }
  }, [position]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative justify-center items-center flex lg:hidden"
      >
        {icon ?? <AiOutlineInfoCircle />}
      </button>

      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className="relative justify-center items-center hidden lg:flex">
              {icon ?? <AiOutlineInfoCircle />}
            </Popover.Button>

            <Transition
              as={Fragment}
              show={open && overlay}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-30"
              leave="ease-in duration-200"
              leaveFrom="opacity-30"
              leaveTo="opacity-0"
            >
              <Popover.Overlay className="fixed z-50 inset-0 bg-black " />
            </Transition>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 scale-1"
              enterTo="opacity-100 scale-95"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 scale-95"
              leaveTo="opacity-0 scale-1"
            >
              <Popover.Panel
                className={`absolute z-[100] bg-tooltip-bg ${positionCss} w-screen lg:w-[500px] rounded-md`}
              >
                <div className="overflow-hidden p-5 rounded-md shadow-xs ring-2 text-black ring-orange-400 ring-opacity-20 text-left font-light text-base">
                  {children}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Panel
          onClick={() => setIsOpen(false)}
          className={`w-full max-w-[462px] rounded-[10px] bg-tooltip-bg p-6 cursor-pointer ${className} font-light text-base`}
        >
          {title}
          <div className="text-center">{children}</div>
        </Dialog.Panel>
      </Modal>
    </div>
  );
};

export default InfoPopover;
