import { Dialog, Popover, Transition } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { ModalPanel } from "components/ui/ModalPanel";
import { Fragment, ReactNode, useMemo, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";

export type InfoPopoverProps = React.PropsWithChildren<{
  title?: ReactNode;
  icon?: ReactNode;
  className?: string;
  overlay?: boolean;
  popoverCss?: string;
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
  popoverCss,
}) => {
  let [isOpen, setIsOpen] = useState(false);

  const positionCss = useMemo(() => {
    switch (position) {
      case "top":
        return "-top-1 translate-y-[-100%] left-1/2 transform translate-x-[-50%]";
      case "bottom":
        return "top-[100%] left-1/2 transform translate-x-[-50%]";
      case "top-start":
        return "-top-1 translate-y-[-100%] translate-x-[-100%] left-0";
      case "top-end":
        return "-top-1 translate-y-[-100%] left-0";
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
        className="relative flex items-center justify-center outline-none lg:hidden"
      >
        {icon ?? <AiOutlineInfoCircle />}
      </button>

      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className="relative hidden items-center justify-center focus-visible:outline-none lg:flex">
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
                className={`absolute z-[100] ${positionCss} w-screen max-w-[calc(100vw-2rem)] rounded-md lg:w-[564px] ${popoverCss}`}
              >
                <div className="shadow-lg overflow-hidden rounded-md border-2 border-ztg-primary-200/30 bg-ztg-primary-900/95 px-3 py-2 text-left text-sm font-medium text-white/90 backdrop-blur-md">
                  {children}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <ModalPanel
          size="xl"
          className={`cursor-pointer p-6 ${className} text-base font-light`}
        >
          <div onClick={() => setIsOpen(false)}>
            {title}
            <div className="text-center">{children}</div>
          </div>
        </ModalPanel>
      </Modal>
    </div>
  );
};

export default InfoPopover;
