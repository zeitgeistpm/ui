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
}> = ({ close, lifetime = TIMER_TICK_RATE, content, type }) => {
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
      className={`relative flex flex-1 gap-4 rounded-md  px-5 ${getBgColor(
        type,
      )}`}
    >
      <div
        className={`absolute left-0 top-0  z-20 h-1 w-full overflow-hidden rounded-t-md ${getBgColor(
          type,
        )}`}
      >
        <div
          className={`${getTopBarColor(
            type,
          )} absolute left-0 top-0 z-40 h-full transition-all duration-500 ease-linear`}
          style={{
            width: `${((100 * timer) / lifetime).toFixed(2)}%`,
          }}
        />
        <div
          className={`${getTopBarColor(
            type,
          )} absolute left-0 top-0 z-40 h-full  w-full opacity-10`}
        />
      </div>
      <div className="flex justify-center py-6 text-white">
        <div className={`center ${getBgColor(type)}`}>
          <Loader
            loading={Boolean(lifetime)}
            lineThrough={type === "Error"}
            className="h-9 w-9"
            variant={type}
          />
        </div>
      </div>
      <div className="center flex-1 py-6">
        <div className="w-full text-left text-base font-normal">{content}</div>
      </div>
      <div className="py-4">
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
    <div className="pointer-events-none fixed top-0 z-50 h-full w-full">
      <div className="flex flex-row justify-end pt-20">
        <div className="relative flex flex-1 flex-col items-end px-4">
          <AnimatePresence mode="sync" presenceAffectsLayout>
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ x: 300, maxHeight: 0, opacity: 0 }}
                exit={{ x: 300, maxHeight: 0, opacity: 0 }}
                animate={{ x: 0, maxHeight: 900, opacity: 1 }}
                transition={{ type: "spring", duration: 0.7 }}
                className="pointer-events-auto box-border w-full overflow-hidden md:w-[420px] md:max-w-screen-sm"
              >
                <div className="mb-4 flex-1">
                  <NotificationCard
                    dataTest="notificationMessage"
                    key={notification.id}
                    {...notification}
                    close={() => {
                      removeNotification(notification);
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
