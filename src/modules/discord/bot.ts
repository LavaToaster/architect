import { Container, injectable } from 'inversify';
import { Config } from '../../config';
import { Client } from 'discord.js';
import ora from 'ora';
import wait from 'waait';
import { MongoClient } from 'mongodb';
import { MessageListener } from './listeners/message-listener';
import { GuildListener } from './listeners/guild-listener';
import { NewableListener } from './listeners/listener';

@injectable()
export class Bot {
  private listeners: NewableListener[] = [GuildListener, MessageListener];
  private setupSpinner?: ora.Ora;

  constructor(
    private discord: Client,
    private config: Config,
    private mongo: MongoClient,
    private container: Container,
  ) {}

  private async setup() {
    for (let listener of this.listeners) {
      this.container.resolve(listener).subscribe();
    }

    this.discord.once('ready', async () => {
      this.setupSpinner!.succeed('Connected to discord!');

      console.log(`Found ${this.discord.guilds.size} guilds`);
    });
  }

  public async run() {
    this.setupSpinner = ora().start('Connecting to discord');

    await this.setup();

    try {
      await this.discord.login(this.config.get('discord').token);
    } catch (error) {
      return;
    }

    while (true) {
      // keep alive I guess
      await wait(1);
    }
  }
}
