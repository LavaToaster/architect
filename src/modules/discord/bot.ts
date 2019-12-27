import { Container, injectable } from 'inversify';
import { Config } from '../../config';
import { Client } from 'discord.js';
import ora from 'ora';
import wait from 'waait';
import { MongoClient } from 'mongodb';
import { MessageListener } from './listeners/message-listener';
import { GuildListener } from './listeners/guild-listener';
import { NewableListener } from './listeners/listener';
import { ReactionListener } from './listeners/reaction-listener';

@injectable()
export class Bot {
  private listeners: NewableListener[] = [GuildListener, MessageListener, ReactionListener];
  private setupSpinner?: ora.Ora;

  constructor(
    private discord: Client,
    private config: Config,
    private mongo: MongoClient,
    private container: Container,
  ) {}

  public async run() {
    for (let listener of this.listeners) {
      this.container.resolve(listener).subscribe();
    }

    this.setupSpinner = ora().start('Connecting to discord');

    this.discord.once('ready', async () => {
      this.setupSpinner!.succeed('Connected to discord');

      console.log(`Found ${this.discord.guilds.size} guilds`);
    });

    try {
      await this.discord.login(this.config.get('discord').token);
    } catch (error) {
      this.setupSpinner.fail('Unable to login to discord');

      console.error(error);

      return;
    }

    while (true) {
      // keep alive I guess
      await wait(1);
    }
  }
}
