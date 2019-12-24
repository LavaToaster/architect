export interface Listener {
  /**
   * Subscription Method
   */
  subscribe(): Promise<any>;
}

export type NewableListener = {
  new (...any: any[]): Listener;
};
