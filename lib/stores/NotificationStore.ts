import { makeAutoObservable, observable } from "mobx";
import { useStore } from "./Store";
import { NotificationType } from "../types";

class SingleNotificationObservable {
  type: NotificationType = "Info";
  content: string | null = null;

  // maximum timer value
  lifetime: number = 100;

  // timer counts down to 0 and then notification is removed
  timer: number = this.lifetime;

  // automatically remove notification when new one is added
  // regardless of timer value
  autoRemove = false;

  broadcast = false;

  setLifetime(lifetime: number) {
    this.timer = lifetime;
    this.lifetime = lifetime;
  }

  initialize(
    content: string,
    lifetime?: number,
    type?: NotificationType,
    autoRemove?: boolean,
    broadcast?: boolean,
  ) {
    lifetime != null && this.setLifetime(lifetime);
    type != null && (this.type = type);
    this.content = content;
    autoRemove && (this.autoRemove = true);
    broadcast && (this.broadcast = true);
    this.run();
  }

  intervalId: number | null = null;

  constructor(private notificationStore: NotificationStore) {
    makeAutoObservable(this);
  }

  updateTimer() {
    this.timer -= 0.25;
  }

  stop() {
    window.clearInterval(this.intervalId);
    this.timer = 0;
    this.intervalId = null;
  }

  get isRunning(): boolean {
    return this.intervalId != null;
  }

  run() {
    this.intervalId = window.setInterval(() => {
      if (this.timer === 0) {
        return this.notificationStore.removeNotification(this);
      }
      this.updateTimer();
    }, 250);
  }
}

/**
 * The NotificationStore holds the notifications that are displayed using
 * the NotificationCenter component. Eventually it would be smart to
 * abstract this out to its own component that can be used by the community.
 */
export default class NotificationStore {
  notifications: SingleNotificationObservable[] = [];

  constructor() {
    makeAutoObservable(this, { notifications: observable.ref });
  }

  get broadcasting(): boolean {
    return this.notifications.findIndex((n) => n.broadcast) !== -1;
  }

  /**
   * Pushes new notification at end of stack and schedule showing it.
   * @param content text
   * @param options for notification:
   *  - type: one of 'Info', 'Success' or 'Error' (default: Info)
   *  - lifetime: how long should be notification be shown (default 100 seconds)
   *  - autoRemove: true if notification should be hidden when new one is added (default: false)
   */
  pushNotification(
    content: string,
    options?: {
      type?: NotificationType;
      lifetime?: number;
      autoRemove?: boolean;
      broadcast?: boolean;
    },
  ) {
    const { lifetime, type, autoRemove, broadcast } = options || {};

    const newNotification = new SingleNotificationObservable(this);
    const numNotifications = this.notifications.length;

    if (numNotifications > 0) {
      const lastNotification = this.notifications[numNotifications - 1];
      if (lastNotification.autoRemove) {
        this.removeNotification(lastNotification);
      }
    }

    this.notifications = [...this.notifications, newNotification];

    newNotification.initialize(content, lifetime, type, autoRemove, broadcast);

    return newNotification;
  }

  removeNotification(notification: SingleNotificationObservable) {
    const notifications = this.notifications;
    const idx = notifications.indexOf(notification);
    this.notifications = [
      ...notifications.slice(0, idx),
      ...notifications.slice(idx + 1),
    ];
    notification.stop();
  }
}

export const useNotifications = () => {
  const { notificationStore } = useStore();
  return notificationStore;
};
