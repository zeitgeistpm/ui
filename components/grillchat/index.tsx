import grill from "@subsocial/grill-widget";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { MessageSquare } from "react-feather";

type GrillChatProps = {
  className?: string;
};

const GrillChat: React.FC<GrillChatProps> = () => {
  const [isInitialised, setIsInitialised] = useState(false);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (isInitialised === false) {
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
      setIsInitialised(true);
    }

    setOpen(!open);
  };

  return (
    <div
      className={"fixed bottom-0 right-4 w-full mb-4 pointer-events-none z-30"}
    >
      <motion.div
        key="grillchat"
        className="w-screen rounded-md shadow-xl bg-white overflow-hidden ml-auto pointer-events-auto"
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
        <div id="grill" className="h-full"></div>
      </motion.div>
      <button
        className="ml-auto rounded-full cursor-pointer border-1 border-gray-300 w-14 h-14 center shadow-ztg-5 bg-white pointer-events-auto mt-4"
        onClick={handleClick}
      >
        <MessageSquare size={28} />
      </button>
    </div>
  );
};

export default GrillChat;
