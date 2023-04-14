import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "lib/state/notifications";
import { NotificationType } from "lib/types";
import { observer } from "mobx-react";
import React, { FC, useEffect } from "react";
import { AlertTriangle, CheckCircle, Info, X } from "react-feather";

const TIMER_TICK_RATE = 500;

const NotificationCard: FC<{
  close: () => void;
  lifetime: number;
  content: string;
  type: NotificationType;
  dataTest?: string;
}> = observer(({ close, lifetime, content, type, dataTest }) => {
  const [timer, setTimer] = React.useState(lifetime);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((timer) => timer - TIMER_TICK_RATE / 1000);
    }, TIMER_TICK_RATE);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timer <= 0) {
      close();
    }
  }, [timer]);

  return (
    <>
      <span className="text-white ml-ztg-10 mr-ztg-22 flex justify-center ">
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
          className="text-black dark:text-white font-bold text-ztg-16-150 flex items-center w-full"
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
          className={`h-ztg-2 my-ztg-5 ${getColor(
            type,
          )} transition-all ease-linear`}
          style={{
            transitionDuration: `${TIMER_TICK_RATE}ms`,
            width: `${((100 * timer) / lifetime).toFixed(2)}%`,
          }}
        />
        <div className=" text-ztg-12-120 text-sky-600 mb-ztg-8">{content}</div>
      </span>
    </>
  );
});

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
  switch (type) {
    case "Success":
      return "linear-gradient(90deg, rgba(112, 199, 3, 0.2) 0%, rgba(0, 0, 0, 0) 100%),linear-gradient(0deg, #FFFFFF, #FFFFFF)";
    case "Info":
      return "linear-gradient(90deg, rgba(0, 160, 250, 0.2) 0%, rgba(0, 0, 0, 0) 100%),linear-gradient(0deg, #FFFFFF, #FFFFFF)";
    case "Error":
      return "linear-gradient(90deg, rgba(233, 3, 3, 0.2) 0%, rgba(0, 0, 0, 0) 100%),linear-gradient(0deg, #FFFFFF, #FFFFFF)";
  }
};

const NotificationCenter = observer(() => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed h-full w-full top-0 pointer-events-none z-50">
      <div className="flex flex-row justify-end pr-ztg-27 pt-20">
        <div className="flex flex-col">
          <AnimatePresence>
            {notifications.map((notification, index) => (
              <motion.div
                key={index}
                initial={{ x: 300, opacity: 0 }}
                exit={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", duration: 0.7 }}
                className="mb-[17px] flex rounded-ztg-5 border-1 border-sky-600 p-ztg-14 pointer-events-auto"
                style={{
                  width: "304px",
                  background: getGradient(notification.type),
                }}
              >
                <NotificationCard
                  dataTest="notificationMessage"
                  key={notification.id}
                  {...notification}
                  close={() => {
                    removeNotification(notification);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default NotificationCenter;
