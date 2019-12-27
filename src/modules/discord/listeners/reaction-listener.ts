import Discord, { Guild, MessageReaction, TextChannel, User } from 'discord.js';
import { Collection, MongoClient } from 'mongodb';
import { Listener } from './listener';
import { injectable } from 'inversify';
import { RoleDocument, RoleService } from '../servies/role-service';
import { boundMethod } from 'autobind-decorator';

@injectable()
export class ReactionListener implements Listener {
  private roles: Collection<RoleDocument> = this.mongo.db().collection('roles');

  constructor(private discord: Discord.Client, private mongo: MongoClient, private roleService: RoleService) {}

  public async subscribe() {
    this.discord.on('messageReactionAdd', this.handleMessageReactionAdd);
    this.discord.on('messageReactionRemove', this.handleMessageReactionRemove);
    this.discord.on('raw', this.handleRaw);
  }

  @boundMethod
  private async handleMessageReactionAdd(reaction: MessageReaction, user: User) {
    // Prevent listening to own reactions
    if (user.id === this.discord.user.id) {
      return;
    }

    let emoji = reaction.emoji.name;

    if (reaction.emoji.id) {
      emoji = `<a:${reaction.emoji.name}:${reaction.emoji.id}>`;
    }

    await reaction.message.channel.sendMessage(`Looks like <@${user.id}> wants the ${emoji} role 😍`);

    // if (this.roleService.getRoleAssignment(reaction.message.id, reaction.emoji.id))
  }

  @boundMethod
  private async handleMessageReactionRemove(reaction: MessageReaction, user: User) {
    // Prevent listening to own reactions
    if (user.id === this.discord.user.id) {
      return;
    }

    let emoji = reaction.emoji.name;

    if (reaction.emoji.id) {
      emoji = `<a:${reaction.emoji.name}:${reaction.emoji.id}>`;
    }

    await reaction.message.channel.sendMessage(`Looks like <@${user.id}> does not wants the ${emoji} role 😭`);

    console.log('remove', reaction);
  }

  @boundMethod
  private handleRaw(packet: any) {
    // source: https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md

    // We don't want this to run on unrelated packets
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    // Grab the channel to check the message from
    const channel = this.discord.channels.get(packet.d.channel_id) as TextChannel;
    // There's no need to emit if the message is cached, because the event will fire anyway for that
    if (channel!.messages.has(packet.d.message_id)) return;
    // Since we have confirmed the message is not cached, let's fetch it
    channel.fetchMessage(packet.d.message_id).then((message) => {
      // Emoji's can have identifiers of name:id format, so we have to account for that case as well
      const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;

      // This gives us the reaction we need to emit the event properly, in top of the message object
      const reaction = message.reactions.get(emoji);

      // Adds the currently reacting user to the reaction's users collection.
      if (reaction) {
        reaction.users.set(packet.d.user_id, this.discord.users.get(packet.d.user_id)!);
      }

      // Check which type of event it is before emitting
      if (packet.t === 'MESSAGE_REACTION_ADD') {
        this.discord.emit('messageReactionAdd', reaction, this.discord.users.get(packet.d.user_id));
      }

      if (packet.t === 'MESSAGE_REACTION_REMOVE') {
        this.discord.emit('messageReactionRemove', reaction, this.discord.users.get(packet.d.user_id));
      }
    });
  }
}
