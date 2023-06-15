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
      setTimeout(() => {
        close();
      }, TIMER_TICK_RATE);
    }
  }, [timer, lifetime]);

  return (
    <div
      className={`flex relative gap-4 rounded-md px-4  flex-1 ${getBgColor(
        type,
      )}`}
    >
      <div
        className={`absolute top-0 left-0  h-1 w-full rounded-t-md overflow-hidden z-20 ${getBgColor(
          type,
        )}`}
      >
        <div
          className={`${getTopBarColor(
            type,
          )} h-full absolute z-40 top-0 left-0 transition-all duration-500 ease-linear`}
          style={{
            width: `${((100 * timer) / lifetime).toFixed(2)}%`,
          }}
        />
        <div
          className={`${getTopBarColor(
            type,
          )} h-full absolute z-40 top-0 left-0  w-full opacity-10`}
        />
      </div>
      <div className="text-white flex justify-center px-4 py-6">
        <div className={`center ${getBgColor(type)}`}>
          <Loader
            loading={Boolean(lifetime)}
            lineThrough={type === "Error"}
            className="h-12 w-12"
            variant={type}
          />
        </div>
      </div>
      <div className="center flex-1 py-6">
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
      return "bg-[#31C48D]";
    case "Info":
      return "bg-[#31A1C4]";
    case "Error":
      return "bg-[#C43131]";
  }
};

const NotificationCenter = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed h-full w-full top-0 pointer-events-none z-50">
      <div className="flex flex-row justify-end pt-20">
        <div className="flex relative flex-col items-end flex-1 px-4">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ x: 300, opacity: 0 }}
                exit={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", duration: 0.7 }}
                className="mb-4 pointer-events-auto relative flex justify-end"
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
