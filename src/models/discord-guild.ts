import { Guild } from 'discord.js';
import { Document, model, Schema } from 'mongoose';

export interface ReactionRole {
  emoji: string;
  roleId: string;
}

interface PermissionDocument {
  identifier: string;
  permission: string;
}

interface DiscordGuildDocument extends Document {
  name: string;
  active: boolean;
  ownerId: string;
  permissions: PermissionDocument[];
  reactionRoles: ReactionRole[];
}

const ReactionRole = new Schema({
  emoji: { type: String, required: true },
  roleId: { type: String, required: true },
});

const PermissionSchema = new Schema({
  identifier: { type: String, required: true },
  permission: { type: String, required: true },
});

const DiscordGuildSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    active: { type: Boolean, required: true },
    ownerId: { type: String, required: true },
    permissions: { type: [PermissionSchema], required: true },
    reactionRoles: { type: [ReactionRole], required: true },
  },
  {
    timestamps: true,
  },
);

export const DiscordGuild = model<DiscordGuildDocument>('DiscordGuild', DiscordGuildSchema, 'discord-guilds');

export function fromGuild({ id, name, ownerID: ownerId }: Guild) {
  return {
    _id: id,
    name,
    ownerId,
    active: true,
  };
}
