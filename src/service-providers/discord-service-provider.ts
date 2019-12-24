import { ServiceProvider } from './service-provider';
import { Bot } from '../modules/discord/bot';
import { Client } from 'discord.js';

export default class DiscordServiceProvider extends ServiceProvider {
  async register() {
    this.container
      .bind(Bot)
      .toSelf()
      .inSingletonScope();

    this.container
      .bind(Client)
      .toSelf()
      .inSingletonScope();
  }
}
