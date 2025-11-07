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
        widgetElementId: "grill",
        hub: { id: "12661" },
        channel: {
          type: "channel",
          id: "92846",
          settings: {
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
      className={"pointer-events-none fixed bottom-0 right-4 z-30 mb-4 w-full"}
    >
      <motion.div
        key="grillchat"
        className="pointer-events-auto ml-auto w-screen overflow-hidden rounded-md bg-white shadow-xl"
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
        className="center pointer-events-auto ml-auto mt-4 h-14 w-14 cursor-pointer rounded-full border-2 border-gray-300 bg-white shadow-ztg-5"
        onClick={handleClick}
      >
        <MessageSquare size={28} />
      </button>
    </div>
  );
};

export default GrillChat;
