import { Session, SessionSource } from '../models';

export async function getActiveByChannelUser(channelId: string, userId: string) {
  return Session.findOne({ channelId, userId, active: true });
}

export async function create(channelId: string, userId: string, cmd: string, context: object, messageIds: string[]) {
  const session = new Session({
    active: true,
    cmd,
    context,
    source: SessionSource.DISCORD,
    userId,
    channelId,
    messageIds,
  });
  await session.save();
}

export async function update(channelId: string, userId: string, context: object, messageIds: string[]) {
  await Session.updateOne(
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

export async function finish(channelId: string, userId: string) {
  await Session.updateOne(
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
