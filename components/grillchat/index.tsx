import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { MessageSquare } from "react-feather";
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
      theme: "light",
      channel: {
        type: "channel",
        id: "zeitgeist-2052",
        settings: {
          enableInputAutofocus: false, // doesn't work
          enableBackButton: false,
          enableLoginButton: true,
        },
      },
    });
  }, []);

  return (
    <div className={"fixed flex flex-col bottom-0 right-0 p-4 mt-2 gap-4 "}>
      <motion.div
        key="grillchat"
        className="w-full rounded-md shadow-xl bg-white overflow-hidden"
        layout={false}
        initial={{ opacity: 0 }}
        animate={
          open
            ? { opacity: 1, display: "block" }
            : { opacity: 0, transitionEnd: { display: "none" } }
        }
        transition={{ ease: "easeInOut", duration: 0.2 }}
        style={{
          height: "min(570px, 90vh - 120px)",
          width: "min(400px, 100vw - 60px)",
        }}
      >
        <div id="grill" className="h-full"></div>,
      </motion.div>
      <div
        className="ml-auto rounded-full cursor-pointer border-1 border-gray-300 w-14 h-14 center shadow-ztg-5"
        onClick={() => setOpen(!open)}
      >
        <MessageSquare size={28} />
      </div>
    </div>
  );
};

export default GrillChat;
