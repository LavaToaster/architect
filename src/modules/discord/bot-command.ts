export interface BotCommand {
  handle(): Promise<number>;
}

export type NewableBotCommand = {
  readonly command: string;
  new (...any: any[]): BotCommand;
};
