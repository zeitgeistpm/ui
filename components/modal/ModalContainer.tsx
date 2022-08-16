import { motion } from "framer-motion";
import { useModalStore } from "lib/stores/ModalStore";
import { observer } from "mobx-react";
import { FC, useEffect, useRef } from "react";

const defaultStyle: React.CSSProperties = {
  width: "320px",
};

const ModalContainer: FC = observer(({ children }) => {
  const modalRef = useRef<HTMLDivElement>();
  const modalStore = useModalStore();

  const { options } = modalStore;
  const { styles } = options;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        modalStore.closeModal();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef]);

  useEffect(() => {
    if (modalStore.onEnterKeyPress == null) {
      return;
    }
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        modalStore.onEnterKeyPress();
      }
    };
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [modalStore.onEnterKeyPress]);

  useEffect(() => {
    modalRef.current.focus();
  }, [modalRef]);

  const containerClasses =
    "p-ztg-15 z-50 rounded-ztg-10 bg-white dark:text-white dark:bg-sky-1000 focus:outline-none";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05, type: "tween" }}
      className="fixed w-full h-full z-ztg-50 bg-light-overlay dark:bg-dark-overlay flex justify-center items-center"
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.05, type: "tween" }}
        tabIndex={0}
        ref={modalRef}
        className={containerClasses}
        style={{
          ...defaultStyle,
          ...styles,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
});

export default ModalContainer;
