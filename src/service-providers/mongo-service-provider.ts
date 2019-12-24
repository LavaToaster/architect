import { ServiceProvider } from './service-provider';
import { MongoClient } from 'mongodb';
import chalk from 'chalk';
import { Figures } from '../figures';
import { boundMethod } from 'autobind-decorator';
import ora from 'ora';

export default class MongoServiceProvider extends ServiceProvider {
  async register() {
    this.container
      .bind(MongoClient)
      .toDynamicValue(this.configureMongo)
      .inSingletonScope();
  }

  public async boot() {
    const spinner = ora().start('Connecting to mongo');
    try {
      await this.container.get(MongoClient).connect();
      spinner.succeed('Connected to mongo');
    } catch (e) {
      spinner.fail('Failed to connect to mongo');
    }
  }

  @boundMethod
  private configureMongo() {
    if (!this.config.has('mongo')) {
      console.log(`${chalk.red(Figures.cross)} Mongo credentials have not been configured, please run configuration.`);
      process.exit(1);
    }

    const { uri, user, password } = this.config.get('mongo');

    // mongodb://localhost/

    return new MongoClient(uri, {
      useUnifiedTopology: true,
      authSource: 'admin',
      auth: {
        user,
        password,
      },
      connectTimeoutMS: 500,
    });
  }
}
