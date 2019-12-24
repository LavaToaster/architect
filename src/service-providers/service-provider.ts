import { Container } from 'inversify';
import { Config } from '../config';

export abstract class ServiceProvider {
  public constructor(protected container: Container, protected config: Config) {}

  /**
   * Registers any services
   */
  async register() {}

  /**
   * Bootstrap any service
   */
  async boot(...any: any[]) {}
}

export type NewableServiceProvider = {
  new (...any: any[]): ServiceProvider;
};
