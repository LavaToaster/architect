import { Collection, Db } from 'mongodb';
import uuid from 'uuid/v4';
import { provide } from 'inversify-binding-decorators';

export interface RoleDocument<T = { [key: string]: any }> {
  id: string;
  guildId: string;
  messageId: string;
  roleId: string;
  emojiId: string;
  active: boolean;
}

@provide(RoleService)
export class RoleService {
  private roles: Collection<RoleDocument> = this.db.collection('roles');

  constructor(private db: Db) {}

  public async getRoleAssignment(messageId: string, emojiId: string) {
    return this.roles.findOne({ messageId, emojiId, active: true });
  }

  public async createRoleAssignment(guildId: string, messageId: string, emojiId: string, roleId: string) {
    await this.roles.insertOne({
      id: uuid(),
      guildId,
      messageId,
      emojiId,
      roleId,
      active: true,
    });
  }
}
