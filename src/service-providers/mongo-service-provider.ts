import { ServiceProvider } from './service-provider';
import { Db } from 'mongodb';
import mongoose from 'mongoose';
import chalk from 'chalk';
import { Figures } from '../figures';
import ora from 'ora';

export default class MongoServiceProvider extends ServiceProvider {
  public async register() {
    if (!this.config.has('mongo')) {
      console.log(`${chalk.red(Figures.cross)} Mongo credentials have not been configured, please run configuration.`);
      process.exit(1);
    }
  }

  public async boot() {
    const spinner = ora().start('Connecting to mongo');
    try {

      const { uri, user, password } = this.config.get('mongo');

      const Mongoose = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        authSource: 'admin',
        auth: {
          user,
          password,
        },
        connectTimeoutMS: 500,
      });

      this.container
        .bind(Db)
        .toConstantValue(Mongoose.connection.db);

      spinner.succeed('Connected to mongo');
    } catch (e) {
      spinner.fail('Failed to connect to mongo');
      throw e;
    }
  }
}
