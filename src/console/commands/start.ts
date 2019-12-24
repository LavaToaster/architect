import { ConsoleCommand, NewableConsoleCommand } from '../console-command';
import { injectable } from 'inversify';
import { Bot } from '../../modules/discord/bot';

@injectable()
export default class Start implements ConsoleCommand {
  public static readonly command = 'start';

  constructor(private bot: Bot) {}

  async handle() {
    await this.bot.run();

    return 1;
  }
}
