import { Collection, MongoClient } from 'mongodb';
import uuid from 'uuid/v4';
import { provide } from 'inversify-binding-decorators';

export interface SessionDocument<T = { [key: string]: any }> {
  id: string;
  active: boolean;
  cmd: string;
  context: T;
  // this feels a bit naive if the chat is going on via bot DM's
  //  but i'll get around to it
  channelId: string;
  userId: string;
  messageIds: string[];
}

@provide(SessionService)
export class SessionService {
  private sessions: Collection<SessionDocument> = this.mongo.db().collection('session');

  constructor(private mongo: MongoClient) {}

  public async getActiveSession(channelId: string, userId: string) {
    return this.sessions.findOne({ channelId, userId, active: true });
  }

  public async createSession(
    channelId: string,
    userId: string,
    cmd: string,
    context: SessionDocument['context'],
    messageIds: string[],
  ) {
    await this.sessions.insertOne({
      id: uuid(),
      channelId,
      userId,
      cmd,
      active: true,
      context,
      messageIds: messageIds,
    });
  }

  public async updateSession(
    channelId: string,
    userId: string,
    context: SessionDocument['context'],
    messageIds: string[],
  ) {
    await this.sessions.findOneAndUpdate(
      {
        channelId,
        userId,
        active: true,
      },
      {
        $set: {
          context,
        },
        $addToSet: {
          messageIds: {
            $each: messageIds,
          },
        },
      },
    );
  }

  public async finishSession(channelId: string, userId: string) {
    await this.sessions.findOneAndUpdate(
      {
        channelId,
        userId,
        active: true,
      },
      {
        $set: {
          active: false,
        },
      },
    );
  }
}
