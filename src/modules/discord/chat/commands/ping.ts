import { Message } from 'discord.js';
import { BotCommand } from '../bot-command';
import { injectable } from 'inversify';

@injectable()
export default class Ping implements BotCommand {
  static signature = 'ping';

  async handleMessage(message: Message) {
    await message.reply('pong');
  }
}
