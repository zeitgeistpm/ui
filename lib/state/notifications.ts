import { atom, getDefaultStore, useAtom } from "jotai";
import { generateGUID } from "lib/util/generate-guid";

import { NotificationType } from "../types";

export type Notification = {
  /**
   * Unique ID of the notification.
   */
  id: string;
  /**
   * Type of the notification.
   */
  type: NotificationType;
  /**
   * Content of the notification.
   */
  content: string | null;
  /**
   * Whether the notification should be removed automatically when a new notifications is pushed.
   */
  autoRemove: boolean;
  /**
   * Lifetime of the notification in seconds.
   */
  lifetime: number;
};

export type UseNotifications = {
  /**
   * List of notifications.
   */
  readonly notifications: Readonly<Notification>[];
  /**
   * Pushe a new notification to the notification list.
   *
   * @param content - Content of the notification.
   * @param options - Options for the notification.
   */
  pushNotification(
    content: string,
    options?: {
      type?: NotificationType;
      lifetime?: number;
      autoRemove?: boolean;
    },
  ): Readonly<Notification>;
  /**
   * Remove a noptification from the notification list, you can pass the notification object or the id.
   *
   * @param notification - Notification to remove.
   */
  removeNotification(notification: Notification | string): void;
};

/**
 * The tick rate of notification timers in milliseconds.
 */
export const TIMER_TICK_RATE = 500;

/**
 * Use the default store jotai store.
 */
const store = getDefaultStore();
/**
 * Atom storage of notifications.
 */
const notificationsAtom = atom<Notification[]>([]);

/**
 * Timer to update the timer of the notifications.
 */
// let updateTimer: NodeJS.Timer = null;

/**
 * Every time the state changes we start processing existing notifications
 * and decrement their timer every 250ms. If the timer reaches 0 we remove the notification from the list.
 */
// store.sub(notificationsAtom, () => {
//   const notifications = store.get(notificationsAtom);

//   if (notifications.length > 0 && !updateTimer) {
//     updateTimer = setInterval(() => {
//       store.set(notificationsAtom, (notifications) =>
//         notifications
//           .map((n) => ({
//             ...n,
//             timer: n.timer - TIMER_TICK_RATE / 1000,
//           }))
//           .filter((n) => n.timer > 0),
//       );
//     }, TIMER_TICK_RATE);
//   } else if (notifications.length === 0 && updateTimer) {
//     clearInterval(updateTimer);
//     updateTimer = null;
//   }
// });

/**
 * Hook to use the notification state.
 *
 * @returns UseNotifications
 */
export const useNotifications = (): UseNotifications => {
  const [notifications, setNotifications] = useAtom(notificationsAtom);

  const pushNotification: UseNotifications["pushNotification"] = (
    content,
    options,
  ) => {
    let nextNotifications = [...notifications];

    const latestNotification = notifications[notifications.length - 1];

    if (latestNotification?.autoRemove) {
      nextNotifications = notifications.slice(0, -1);
    }

    const notification: Notification = {
      id: generateGUID(),
      content,
      autoRemove: options.autoRemove ?? false,
      lifetime: options.lifetime ?? 100,
      type: options.type ?? "Info",
    };

    nextNotifications = [...nextNotifications, notification];

    setNotifications(nextNotifications);

    return notification;
  };

  const removeNotification: UseNotifications["removeNotification"] = (
    notification,
  ) => {
    setNotifications(
      notifications.filter((n) =>
        typeof notification === "string"
          ? n.id !== notification
          : n.id !== notification.id,
      ),
    );
  };

  return {
    notifications,
    pushNotification,
    removeNotification,
  };
};
