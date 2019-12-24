import { Message } from "discord.js";

export default class Ping {
  static signature = 'ping';

  async run(message: Message) {
    await message.reply('pong');
  }
}
