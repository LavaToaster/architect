import { Message } from 'discord.js';
import { BotCommand } from '../bot-command';
import { injectable } from 'inversify';
import { reactRoleMachine } from "../state-machine/react-role-machine";

@injectable()
export default class ReactRole implements BotCommand {
  static signature = 'react-role';

  async getMachine(message: Message) {
    // if (message.content === 'stop') {
    //   await SessionRepository.finish(message.channel.id, message.author.id);
    //   await message.react('👍');
    //   return;
    // }
    return reactRoleMachine;
  }
}
