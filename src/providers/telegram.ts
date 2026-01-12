import * as dotenv from "dotenv";
import type { INotificationProvider } from "../interfaces";
import { Config } from "../utils/config";
import { validateResponse } from "../utils/http-utils";

dotenv.config();

export default class TelegramProvider implements INotificationProvider {
  private readonly baseUrl: string;
  private readonly chatId: string;

  constructor() {
    this.baseUrl = `${Config.telegram.botUrl}${process.env.TELEGRAM_BOT_ID}`;
    this.chatId = process.env.TELEGRAM_CHAT_ID || "";
  }

  async sendMessage(message: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: this.chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    validateResponse(response, "Telegram");

    console.log("Telegram: Message sent successfully");
  }
}
