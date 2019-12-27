import Conf from 'conf';
import { fluentProvide } from 'inversify-binding-decorators';

export interface ConfigFile {
  sentry: {
    dsn: string;
  };
  mongo: {
    uri: string;
    user: string;
    password: string;
  };
  discord: {
    token: string;
  };
}

@(fluentProvide(Config)
  .inSingletonScope()
  .done())
export class Config extends Conf<ConfigFile> {
  constructor() {
    super({ projectName: 'architect' });
  }
}
