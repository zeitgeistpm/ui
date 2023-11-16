import { Dialog, Popover, Transition } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { Fragment, ReactNode, useMemo, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";

export type InfoPopoverProps = React.PropsWithChildren<{
  title?: ReactNode;
  icon?: ReactNode;
  className?: string;
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
        className="relative flex items-center justify-center lg:hidden"
      >
        {icon ?? <AiOutlineInfoCircle />}
      </button>

      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className="relative hidden items-center justify-center lg:flex">
              {icon ?? <AiOutlineInfoCircle />}
            </Popover.Button>

            <Transition
              as={Fragment}
              show={open}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-30"
              leave="ease-in duration-200"
              leaveFrom="opacity-30"
              leaveTo="opacity-0"
            >
              <Popover.Overlay className="fixed inset-0 z-50 bg-black " />
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
                className={`absolute z-[100] bg-tooltip-bg ${positionCss} w-screen rounded-md lg:w-[500px]`}
              >
                <div className="shadow-xs overflow-hidden rounded-md p-5 text-left text-base font-light text-black ring-2 ring-orange-400 ring-opacity-20">
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
          className={`w-full max-w-[462px] cursor-pointer rounded-[10px] bg-tooltip-bg p-6 ${className} text-base font-light`}
        >
          {title}
          <div className="text-center">{children}</div>
        </Dialog.Panel>
      </Modal>
    </div>
  );
};

export default InfoPopover;
