import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import grill from "@subsocial/grill-widget";

type GrillChatProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  className?: string;
};

const GrillChat: React.FC<GrillChatProps> = ({ open, setOpen }) => {
  useEffect(() => {
    grill.init({
      channel: {
        type: "channel",
        id: "polkadot-754",
        settings: {
          enableInputAutofocus: false, // doesn't work
          enableBackButton: false,
          enableLoginButton: true,
        },
      },
    });
  }, []);

  return (
    <div
      className={"fixed bottom-0 right-0 px-4 mt-2 " + (open ? "w-full" : "")}
    >
      <motion.div
        key="grillchat"
        className="p-4 w-full absolute right-0 top-[-500px] sm:w-[500px] h-[500px] "
        layout={false}
        initial={{ opacity: 0 }}
        animate={
          open
            ? { opacity: 1, display: "block" }
            : { opacity: 0, transitionEnd: { display: "none" } }
        }
        transition={{ ease: "easeInOut", duration: 0.2 }}
      >
        <div id="grill" className="h-full p-1"></div>,
      </motion.div>
      <Image
        src="/icons/grillchat.svg"
        width={58}
        height={58}
        alt="Open chat"
        className="ml-auto cursor-pointer"
        onClick={() => setOpen(!open)}
      />
    </div>
  );
};

export default GrillChat;
