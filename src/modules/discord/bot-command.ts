import { Message } from 'discord.js';
import { SessionDocument } from './servies/session-service';

export interface BotCommand {
  handleMessage(message: Message, args: string[]): Promise<any>;
  handleSession?(message: Message, session: SessionDocument): Promise<any>;
}

export type NewableBotCommand = {
  readonly signature: string;
  new (...any: any[]): BotCommand;
};
