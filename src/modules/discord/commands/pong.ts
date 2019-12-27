import { Message } from 'discord.js';
import { BotCommand } from '../bot-command';
import { injectable } from 'inversify';

@injectable()
export default class Pong implements BotCommand {
  static signature = 'pong';

  async handleMessage(message: Message) {
    await message.reply('ping');
  }
}
