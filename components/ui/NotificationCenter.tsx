import { AnimatePresence, motion } from "framer-motion";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useUserStore } from "lib/stores/UserStore";
import { NotificationType } from "lib/types";
import { observer } from "mobx-react";
import React, { FC } from "react";
import { AlertTriangle, CheckCircle, Info, X } from "react-feather";

const NotificationCard: FC<{
  close: () => void;
  timer: number;
  lifetime: number;
  content: string;
  type: NotificationType;
  dataTest?: string;
}> = observer(({ close, timer, lifetime, content, type, dataTest }) => {
  const userStore = useUserStore();

  const getColor = (type: NotificationType) => {
    switch (type) {
      case "Success":
        return "bg-sheen-green";
      case "Info":
        return "bg-info-blue";
      case "Error":
        return "bg-vermilion";
    }
  };

  const getMessage = (type: NotificationType) => {
    switch (type) {
      case "Success":
        return "Success!";
      case "Info":
        return "Info!";
      case "Error":
        return "Error!";
    }
  };

  const getGradient = (type: NotificationType) => {
    if (userStore.theme === "dark") {
      switch (type) {
        case "Success":
          return "linear-gradient(90deg,rgba(112, 199, 3, 0.3) 0%,rgba(0, 0, 0, 0) 100%),linear-gradient(0deg, #11161f, #11161f)";
        case "Info":
          return "linear-gradient(90deg, rgba(0, 160, 250, 0.3) 0%, rgba(0, 0, 0, 0) 100%),linear-gradient(0deg, #11161F, #11161F)";
        case "Error":
          return "linear-gradient(90deg, rgba(233, 3, 3, 0.3) 0%, rgba(0, 0, 0, 0) 100%),linear-gradient(0deg, #11161F, #11161F)";
      }
    } else {
      switch (type) {
        case "Success":
          return "linear-gradient(90deg, rgba(112, 199, 3, 0.2) 0%, rgba(0, 0, 0, 0) 100%),linear-gradient(0deg, #FFFFFF, #FFFFFF)";
        case "Info":
          return "linear-gradient(90deg, rgba(0, 160, 250, 0.2) 0%, rgba(0, 0, 0, 0) 100%),linear-gradient(0deg, #FFFFFF, #FFFFFF)";
        case "Error":
          return "linear-gradient(90deg, rgba(233, 3, 3, 0.2) 0%, rgba(0, 0, 0, 0) 100%),linear-gradient(0deg, #FFFFFF, #FFFFFF)";
      }
    }
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      exit={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", duration: 0.7 }}
      className="mb-ztg-17 flex rounded-ztg-5 border-1 border-sky-600 p-ztg-14 pointer-events-auto"
      style={{
        width: "304px",
        background: getGradient(type),
      }}
    >
      <span className="text-white ml-ztg-10 mr-ztg-22 flex  justify-center ">
        <div
          className={`p-ztg-5 rounded-ztg-5 w-ztg-34 h-ztg-34 mt-ztg-14 ${getColor(
            type,
          )}`}
        >
          {(() => {
            if (type === "Error") {
              return <AlertTriangle size={24} />;
            }
            if (type === "Info") {
              return <Info size={24} />;
            }
            if (type === "Success") {
              return <CheckCircle size={24} />;
            }
          })()}
        </div>
      </span>
      <span className="w-full">
        <div
          className="text-black dark:text-white font-space font-bold text-ztg-16-150 flex items-center w-full"
          data-test={dataTest}
        >
          <span>{getMessage(type)}</span>
          <X
            className="text-sky-600 ml-auto cursor-pointer"
            size={22}
            onClick={close}
            role="button"
          />
        </div>
        <div
          className={`h-ztg-2 my-ztg-5 ${getColor(type)}`}
          style={{
            width: `${((100 * timer) / lifetime).toFixed(2)}%`,
          }}
        />
        <div className="font-lato text-ztg-12-120 text-sky-600 mb-ztg-8">
          {content}
        </div>
      </span>
    </motion.div>
  );
});

const NotificationCenter = observer(() => {
  const notificationStore = useNotificationStore();

  return (
    <div className="fixed h-full w-full top-0 pointer-events-none z-ztg-50">
      <div className="flex flex-row justify-end pr-ztg-27 pt-20">
        <div className="flex flex-col">
          <AnimatePresence>
            {notificationStore.notifications.map((n, idx) => (
              <NotificationCard
                dataTest="notificationMessage"
                key={idx}
                {...n}
                close={() => {
                  notificationStore.removeNotification(n);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default NotificationCenter;
