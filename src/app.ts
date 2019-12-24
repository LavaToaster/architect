import 'reflect-metadata';
import { Container, interfaces } from 'inversify';
import { Config } from './config';
import { buildProviderModule } from 'inversify-binding-decorators';
import chalk from 'chalk';
import { Figures } from './figures';
import { argv } from 'yargs';
import { loadCommands } from './console';
import { NewableConsoleCommand } from './console/console-command';
import MongoServiceProvider from './service-providers/mongo-service-provider';
import { ServiceProvider } from './service-providers/service-provider';
import DiscordServiceProvider from './service-providers/discord-service-provider';
import './decorate';

const serviceProviders = [MongoServiceProvider, DiscordServiceProvider];

export class App {
  private readonly commandMap: { [key: string]: NewableConsoleCommand } = {};
  private readonly providers: ServiceProvider[] = [];
  private readonly config: Config;

  public constructor(private container = new Container({ skipBaseClassChecks: true })) {
    // container.applyMiddleware(makeLoggerMiddleware());
    container.load(buildProviderModule());
    this.config = container.resolve(Config);

    container.bind(Container).toConstantValue(container);

    for (const Provider of serviceProviders) {
      const serviceProvider = new Provider(container, this.config);
      this.providers.push(serviceProvider);
    }
  }

  private async bootstrap() {
    const queue = [];

    // Register Service
    for (const provider of this.providers) {
      queue.push(provider.register());
    }

    await Promise.all(queue);

    // Register console commands
    const commands = await loadCommands();

    commands.map((item) => {
      this.commandMap[item.command] = item;
    });
  }

  private async boot() {
    const queue = [];

    // Register Service
    for (const provider of this.providers) {
      queue.push(provider.boot());
    }

    await Promise.all(queue);
  }

  public async run() {
    const commandName = argv._[0];

    await this.bootstrap();

    // TODO: Find a better way of booting the app for this command
    if (commandName !== 'setup') {
      await this.boot();
    }

    if (!this.commandMap[commandName]) {
      console.log(`${chalk.red(Figures.cross)} Invalid command "${commandName}"`);
      console.log(`Valid commands ${Object.keys(this.commandMap).join(', ')}`);
      process.exit(1);
    }

    const command = this.container.resolve(this.commandMap[commandName]);
    const result = await command.handle();

    process.exit(result);
  }
}
