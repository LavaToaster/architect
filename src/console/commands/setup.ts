import prompts from 'prompts';
import { MongoClient } from 'mongodb';
import chalk from 'chalk';
import { Figures } from '../../figures';
import ora from 'ora';
import { unflatten } from 'flat';
import { Config } from '../../config';
import { ConsoleCommand } from '../console-command';
import { injectable } from 'inversify';

const mongoQuestions: prompts.PromptObject[] = [
  {
    type: 'text',
    name: 'mongo.uri',
    message: 'Mongo URI?',
  },
  {
    type: 'text',
    name: 'mongo.user',
    message: 'Mongo User?',
  },
  {
    type: 'password',
    name: 'mongo.password',
    message: 'Mongo Password?',
  },
];

const authQuestions: prompts.PromptObject[] = [
  {
    type: 'password',
    name: 'discord.token',
    message: 'Discord Bot Token?',
  },
];

async function validateMongoDetails(uri: string, user: string, password: string) {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
    authSource: 'admin',
    auth: {
      user,
      password,
    },
  });

  try {
    await client.connect();
    await client.db('config').collections();

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

@injectable()
export default class Setup implements ConsoleCommand {
  public static readonly command = 'setup';

  constructor(private config: Config) {}

  public async handle() {
    // TODO: If I'm feeling creative, i'll make this check `config.store` to see what's already been configured
    //  and provide a way of configuring it.

    let updated = false;

    if (!this.config.store.mongo) {
      const response = await prompts(mongoQuestions, {
        onCancel: () => process.exit(1),
      });

      const {
        mongo: { uri, user, password },
      } = unflatten(response);

      const spinner = ora().start('Validating Mongo Credentials...');
      const isValid = await validateMongoDetails(uri, user, password);

      if (!isValid) {
        spinner.fail(`Error! Unable to validate mongo credentials. Try again.`);

        return 1;
      }

      spinner.succeed(`Success! The mongo credentials work.`);

      updated = true;
      this.config.set({
        mongo: {
          uri,
          user,
          password,
        },
      });
    }

    if (!this.config.store.discord?.token) {
      const response = await prompts(authQuestions, {
        onCancel: () => process.exit(1),
      });

      const {
        discord: { token },
      } = unflatten(response);

      // TODO: Validate bot auth

      updated = true;
      this.config.set({
        discord: {
          token,
        },
      });
    }

    if (updated) {
      console.log(`${chalk.green(Figures.tick)} Config Updated.`);
    } else {
      console.log(`${chalk.yellow(Figures.tick)} Nothing was updated.`);
      console.log(`  Modify the config file at "${this.config.path}"`);
    }

    return 0;
  }
}
