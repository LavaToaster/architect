import { Message } from "discord.js";

export default class Pong {
  static signature = 'pong';

  async run(message: Message) {
    await message.reply('ping');
  }
}
