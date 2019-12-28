import { DiscordGuild, ReactionRole } from '../models';

export async function addReactionRole(guildId: string, reactionRole: ReactionRole) {
  await DiscordGuild.updateOne({ _id: guildId }, { $addToSet: { reactionRoles: reactionRole } });
}
