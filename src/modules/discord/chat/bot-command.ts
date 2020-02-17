import { Message } from 'discord.js';
import { MachineConfig } from "./state-machine/machine";

export interface BotCommand {
  handleMessage?(message: Message, args: string[]): Promise<any>;
  getMachine?(message: Message): Promise<MachineConfig>;
}

export type NewableBotCommand = {
  readonly signature: string;
  new (...any: any[]): BotCommand;
};
