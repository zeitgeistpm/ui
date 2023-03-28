import { generateGUID } from "lib/util/generate-guid";
import { proxy, subscribe } from "valtio";
import { useProxy } from "valtio/utils";

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
  /**
   * Time left on the notification in seconds.
   */
  timer: number;
};

export type UseNotifications = {
  /**
   * List of notifications.
   */
  notifications: Notification[];
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
  ): Notification;
  /**
   * Remove a noptification from the notification list, you can pass the notification object or the id.
   *
   * @param notification - Notification to remove.
   */
  removeNotification(notification: Notification | string): void;
};

/**
 * Proxy atom storage of notifications.
 */
const proxystate = proxy<{ notifications: Notification[] }>({
  notifications: [],
});

/**
 * Timer to update the timer of the notifications.
 */
let updateTimer: NodeJS.Timer = null;

/**
 * Every time the state changes we start processing existing notifications
 * and decrement their timer every 250ms. If the timer reaches 0 we remove the notification from the list.
 */
subscribe(proxystate, () => {
  clearInterval(updateTimer);
  if (proxystate.notifications.length > 0) {
    updateTimer = setInterval(() => {
      proxystate.notifications = proxystate.notifications
        .map((n) => ({
          ...n,
          timer: n.timer - 0.25,
        }))
        .filter((n) => n.timer > 0);
    }, 250);
  }
});

/**
 * Hook to use the notification state.
 *
 * @returns UseNotifications
 */
export const useNotifications = (): UseNotifications => {
  const state = useProxy(proxystate);

  const pushNotification: UseNotifications["pushNotification"] = (
    content,
    options,
  ) => {
    let notifications = state.notifications;

    const latestNotification =
      state.notifications[state.notifications.length - 1];

    if (latestNotification?.autoRemove) {
      notifications = notifications.slice(0, -1);
    }

    const notification: Notification = {
      id: generateGUID(),
      content,
      autoRemove: options.autoRemove ?? false,
      lifetime: options.lifetime ?? 100,
      timer: options.lifetime ?? 100,
      type: options.type ?? "Info",
    };

    state.notifications = [...notifications, notification];

    return notification;
  };

  const removeNotification: UseNotifications["removeNotification"] = (
    notification,
  ) => {
    state.notifications = state.notifications.filter((n) =>
      typeof notification === "string"
        ? n.id !== notification
        : n.id !== notification.id,
    );
  };

  return {
    notifications: state.notifications,
    pushNotification,
    removeNotification,
  };
};
