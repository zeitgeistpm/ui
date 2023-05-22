import { Dialog, Popover, Transition } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { Fragment, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";

export type InfoPopoverProps = React.PropsWithChildren<{ title: string }>;

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  title,
  children,
}) => {
  let [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative justify-center items-center flex md:hidden"
      >
        <AiOutlineInfoCircle />
      </button>

      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className="relative justify-center items-center hidden md:flex">
              <AiOutlineInfoCircle />
            </Popover.Button>

            <Transition
              as={Fragment}
              show={open}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0 hidden"
            >
              <Popover.Overlay className="fixed z-50 inset-0 bg-black opacity-30" />
            </Transition>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-[100] bg-white top-[100%] right-0 translate-x-[50%] mt-2 ml-2 w-screen md:w-96 rounded-md">
                <div className="overflow-hidden p-4 rounded-md shadow-xs ring-2 ring-black ring-opacity-5 text-center">
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
          className="w-full max-w-[462px] rounded-[10px] bg-white p-6 cursor-pointer"
        >
          <h3 className="flex justify-center items-center mb-4 gap-2">
            <AiOutlineInfoCircle />
            {title}
          </h3>
          <div className="!text-center">{children}</div>
        </Dialog.Panel>
      </Modal>
    </div>
  );
};

export default InfoPopover;
