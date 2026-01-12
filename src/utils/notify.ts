import type { INotificationProvider, Notification } from "../interfaces";
import { formatNotificationMessage } from "./message-formatter";

export default class Notify {
  constructor(private notificationProvider: INotificationProvider) {}

  async notifyAsync(notification: Notification): Promise<void> {
    const message = formatNotificationMessage(notification);
    await this.notificationProvider.sendMessage(message);
  }
}
