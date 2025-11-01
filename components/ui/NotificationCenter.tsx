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
      className={`relative flex flex-1 gap-4 rounded-lg border px-5 shadow-lg backdrop-blur-lg transition-all ${getGlassBgColor(
        type,
      )} ${getBorderColor(type)}`}
    >
      <div
        className={`absolute left-0 top-0 z-20 h-1 w-full overflow-hidden rounded-t-lg ${getProgressBarBg(
          type,
        )}`}
      >
        <div
          className={`absolute left-0 top-0 z-40 h-full transition-all duration-500 ease-linear ${getProgressBarColor(
            type,
          )}`}
          style={{
            width: `${((100 * timer) / lifetime).toFixed(2)}%`,
          }}
        />
      </div>
      <div className="flex justify-center py-6">
        <div className="center">
          <Loader
            loading={Boolean(lifetime)}
            lineThrough={type === "Error"}
            className="h-9 w-9"
            variant={type}
          />
        </div>
      </div>
      <div className="center flex-1 py-6">
        <div
          className={`w-full text-left text-base font-medium ${getTextColor(type)}`}
        >
          {content}
        </div>
      </div>
      <div className="py-4">
        <X
          className={`ml-auto cursor-pointer transition-colors ${getIconColor(type)}`}
          size={22}
          onClick={close}
          role="button"
        />
      </div>
    </div>
  );
};

const getGlassBgColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "bg-emerald-50/95";
    case "Info":
      return "bg-sky-50/95";
    case "Error":
      return "bg-rose-50/95";
  }
};

const getBorderColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "border-emerald-200/40";
    case "Info":
      return "border-sky-200/40";
    case "Error":
      return "border-rose-200/40";
  }
};

const getProgressBarBg = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "bg-emerald-100/50";
    case "Info":
      return "bg-sky-100/50";
    case "Error":
      return "bg-rose-100/50";
  }
};

const getProgressBarColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "bg-gradient-to-r from-emerald-400 to-emerald-500";
    case "Info":
      return "bg-gradient-to-r from-sky-400 to-sky-500";
    case "Error":
      return "bg-gradient-to-r from-rose-400 to-rose-500";
  }
};

const getTextColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "text-emerald-900";
    case "Info":
      return "text-sky-900";
    case "Error":
      return "text-rose-900";
  }
};

const getIconColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "text-emerald-700 hover:text-emerald-900";
    case "Info":
      return "text-sky-700 hover:text-sky-900";
    case "Error":
      return "text-rose-700 hover:text-rose-900";
  }
};

const NotificationCenter = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[200] w-full max-w-[420px] md:right-6">
      <AnimatePresence mode="sync" presenceAffectsLayout>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ x: 300, maxHeight: 0, opacity: 0 }}
            exit={{ x: 300, maxHeight: 0, opacity: 0 }}
            animate={{ x: 0, maxHeight: 900, opacity: 1 }}
            transition={{ type: "spring", duration: 0.7 }}
            className="pointer-events-auto box-border w-full overflow-hidden"
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
  );
};

export default NotificationCenter;
