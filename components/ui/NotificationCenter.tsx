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
      className={`relative flex flex-1 gap-4 rounded-lg border-2 px-5 shadow-lg transition-all ${getGlassBgColor(
        type,
      )} ${getBorderColor(type)}`}
      style={{
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transform: "translateZ(0)",
        willChange: "transform",
      }}
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
      return "bg-white/10 backdrop-blur-lg";
    case "Info":
      return "bg-white/10 backdrop-blur-lg";
    case "Error":
      return "bg-ztg-red-50/95 backdrop-blur-lg";
    default:
      return "bg-white/10 backdrop-blur-lg";
  }
};

const getBorderColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "border-emerald-200/40";
    case "Info":
      return "border-ztg-primary-200/40";
    case "Error":
      return "border-ztg-red-200/40";
  }
};

const getProgressBarBg = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "bg-emerald-100/50";
    case "Info":
      return "bg-emerald-100/50";
    case "Error":
      return "bg-ztg-red-100/50";
    default:
      return "bg-emerald-100/50";
  }
};

const getProgressBarColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "bg-gradient-to-r from-ztg-green-500/60 to-ztg-green-500/80";
    case "Info":
      return "bg-gradient-to-r from-ztg-green-500/60 to-ztg-green-500/80";
    case "Error":
      return "bg-gradient-to-r from-ztg-red-500/60 to-ztg-red-500/80";
    default:
      return "bg-gradient-to-r from-ztg-green-500/60 to-ztg-green-500/80";
  }
};

const getTextColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "text-white/90";
    case "Info":
      return "text-white/90";
    case "Error":
      return "text-ztg-red-900";
    default:
      return "text-white/90";
  }
};

const getIconColor = (type: NotificationType) => {
  switch (type) {
    case "Success":
      return "text-emerald-700 hover:text-emerald-900";
    case "Info":
      return "text-ztg-green-400 hover:text-ztg-green-300";
    case "Error":
      return "text-ztg-red-400 hover:text-ztg-red-300";
    default:
      return "text-ztg-green-400 hover:text-ztg-green-300";
  }
};

const NotificationCenter = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 w-full max-w-[420px] md:right-6"
      style={{
        zIndex: 9999,
      }}
    >
      <AnimatePresence mode="popLayout" presenceAffectsLayout={false}>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ x: 400, opacity: 0.01 }}
            exit={{ x: 400, opacity: 0.01 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              type: "tween",
              ease: [0.16, 1, 0.3, 1],
              duration: 0.5,
              delay: index * 0.05,
            }}
            className="pointer-events-auto relative box-border w-full overflow-hidden"
            style={{
              zIndex: 9999,
              position: "relative",
            }}
          >
            <div
              className="mb-4 flex-1"
              style={{ position: "relative", zIndex: 9999 }}
            >
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
