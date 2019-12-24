export interface ConsoleCommand {
  handle(): Promise<number>;
}

export type NewableConsoleCommand = {
  readonly command: string;
  new (...any: any[]): ConsoleCommand;
};
