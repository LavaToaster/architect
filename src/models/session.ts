import { Document, model, Schema } from 'mongoose';

export enum SessionSource {
  DISCORD = 'discord',
  TWITCH = 'twitch',
}

export interface SessionDocument<T = object> extends Document {
  active: boolean;
  cmd: string;
  context: T;
  source: SessionSource;
  userId: string;
  channelId: string;
  messageIds: string[];
}

const SessionSchema = new Schema(
  {
    active: { type: Boolean, required: true },
    cmd: { type: String, required: true },
    context: Object,
    source: { type: String, required: true, enum: Object.values(SessionSource) },
    userId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageIds: { type: [String], required: true },
  },
  {
    timestamps: true,
  },
);

export const Session = model<SessionDocument>('Session', SessionSchema);
