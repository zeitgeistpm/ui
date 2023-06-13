import { AnimatePresence, motion } from "framer-motion";
import { NotificationType, useNotifications } from "lib/state/notifications";
import React, { FC, useEffect } from "react";
import { X } from "react-feather";
import { Loader } from "./Loader";

const TIMER_TICK_RATE = 500;

const NotificationCard: FC<{
  close: () => void;
  lifetime?: number;
  content: string | React.ReactNode;
  type: NotificationType;
  dataTest?: string;
}> = ({ close, lifetime, content, type, dataTest }) => {
  const [timer, setTimer] = React.useState(lifetime);

  useEffect(() => {
    if (lifetime) {
      const interval = setInterval(() => {
        setTimer((timer) => timer - TIMER_TICK_RATE / 1000);
      }, TIMER_TICK_RATE);

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (lifetime && timer <= 0) {
      close();
    }
  }, [timer, lifetime]);

  return (
    <div
      className={`flex gap-4 rounded-md border-t-4 px-4 min-w-[340px] ${getBgColor(
        type,
      )} ${getTopBarColor(type)}`}
    >
      <div className="text-white flex justify-center px-4 py-6">
        <div className={`center ${getBgColor(type)}`}>
          <Loader
            loading={Boolean(lifetime)}
            lineThrough={type === "Error"}
            className="h-12 w-12"
            gradient={getGradient(type)}
          />
        </div>
      </div>
      <div className="center w-[280px] flex-1 py-6">
        <div className="text-base font-normal text-left w-full">{content}</div>
      </div>
      <div className="px-4 py-4">
        <X
          className="ml-auto cursor-pointer"
          size={22}
          onClick={close}
          role="button"
        />
      </div>
    </div>
  );
};

const getBgColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "bg-success";
    case "Info":
      return "bg-info";
    case "Error":
      return "bg-error";
  }
};

const getTopBarColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "border-[#31C48D]";
    case "Info":
      return "border-[#31A1C4]";
    case "Error":
      return "border-[#C43131]";
  }
};

const getGradient = (type: NotificationType): [string, string] => {
  switch (type) {
    case "Success":
      return ["#31C48D", "#ADFF00"];
    case "Info":
      return ["#31A1C4", "#00F0FF"];
    case "Error":
      return ["#C43131", "#FF6B00"];
  }
};

const NotificationCenter = () => {
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
                className="mb-4 pointer-events-auto"
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
};

export default NotificationCenter;
