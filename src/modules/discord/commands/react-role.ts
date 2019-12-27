import { Message } from 'discord.js';
import { BotCommand } from '../bot-command';
import { injectable } from 'inversify';
import { SessionDocument, SessionService } from '../servies/session-service';
import { RoleService } from '../servies/role-service';
import emojiRegex from 'emoji-regex';

enum ReactRoleState {
  MESSAGE,
  ROLE,
  EMOJI,
  DONE,
}

interface RoleContext {
  state: ReactRoleState;
  roleId: string;
  emojiId: string;
  messageId: string;
  roles?: Array<{ id: string; name: string; position: number }>;
}

const CUSTOM_EMOJI_PATTERN = new RegExp(/^<a?:(\w+):(\w+)>$/);
const emoji = new RegExp(emojiRegex());

@injectable()
export default class ReactRole implements BotCommand {
  static signature = 'react-role';

  constructor(private sessionService: SessionService, private roleService: RoleService) {}

  async handleMessage(message: Message, args: string[]) {
    if (!Array.isArray(args)) {
      return;
    }

    const messageIds = [message.id];

    const message1 = (await message.channel.send('**Reaction Role Setup**')) as Message;
    const message2 = (await message.channel.send('Message ID?')) as Message;

    messageIds.push(message1.id, message2.id);

    await this.sessionService.createSession(
      message.channel.id,
      message.author.id,
      ReactRole.signature,
      {
        state: ReactRoleState.MESSAGE,
      },
      messageIds,
    );
  }

  async handleSession(message: Message, session: SessionDocument<RoleContext>) {
    if (message.content === 'stop') {
      await this.sessionService.finishSession(message.channel.id, message.author.id);
      await message.react('👍');
      return;
    }

    const messageIds = [message.id];

    switch (session.context.state as ReactRoleState) {
      case ReactRoleState.MESSAGE: {
        const roles = [];
        let roleText = '';

        let position = 1;

        for (const { id, name } of message.guild.roles.array()) {
          roles.push({ id, name, position });
          roleText += `${position}. ${name}\n`;

          position++;
        }

        const message1 = (await message.channel.send(
          `Select Role:\n\n${roleText}\nPlease reply with the number of the role.`,
          {
            disableEveryone: true,
          },
        )) as Message;

        messageIds.push(message1.id);

        await this.sessionService.updateSession(
          message.channel.id,
          message.author.id,
          {
            ...session.context,
            state: ReactRoleState.ROLE,
            messageId: message.content,
            roles,
          },
          messageIds,
        );
        break;
      }
      case ReactRoleState.ROLE: {
        const pos = parseInt(message.content);
        const role = session.context.roles!.find(({ position }: any) => pos === position);

        if (!role) {
          const message1 = (await message.channel.send('Invalid role 😢')) as Message;
          messageIds.push(message1.id);

          await this.sessionService.updateSession(message.channel.id, message.author.id, session.context, messageIds);

          return;
        }

        const message1 = (await message.channel.send(`Enter Emoji:`, { disableEveryone: true })) as Message;
        messageIds.push(message1.id);

        await this.sessionService.updateSession(
          message.channel.id,
          message.author.id,
          {
            ...session.context,
            state: ReactRoleState.EMOJI,
            roleId: role.id,
          },
          messageIds,
        );

        break;
      }
      case ReactRoleState.EMOJI: {
        const content = message.content;
        const [match1, name, id] = content.match(CUSTOM_EMOJI_PATTERN) || [];
        const matchedEmoji = content.match(emoji) || [];

        if (matchedEmoji.length > 1 || (matchedEmoji.length > 0 && id)) {
          const message1 = (await message.channel.send('Too many emoji 😖 - I confuse easily please only use one.', {
            disableEveryone: true,
          })) as Message;
          messageIds.push(message1.id);
          await this.sessionService.updateSession(message.channel.id, message.author.id, session.context, messageIds);

          return;
        }

        const emojiId = id || matchedEmoji[0];

        if (!emojiId) {
          const message1 = (await message.channel.send(
            "That doesn't look like a valid emoji to me or you've sent me too many ☹️.\nPlease try again:",
            { disableEveryone: true },
          )) as Message;
          messageIds.push(message1.id);
          await this.sessionService.updateSession(message.channel.id, message.author.id, session.context, messageIds);

          return;
        }

        const message1 = (await message.channel.send('Fantastic!\n\nDo you wish to clean up the chat? (`yes` / `no`)', {
          disableEveryone: true,
        })) as Message;
        messageIds.push(message1.id);

        await this.sessionService.updateSession(
          message.channel.id,
          message.author.id,
          {
            ...session.context,
            emojiId: emojiId,
            state: ReactRoleState.DONE,
          },
          messageIds,
        );

        await this.roleService.createRoleAssignment(
          message.guild.id,
          session.context.messageId,
          emojiId,
          session.context.roleId,
        );

        const roleMessage = await message.channel.fetchMessage(session.context.messageId);
        await roleMessage.react(message.content);

        break;
      }
      case ReactRoleState.DONE: {
        if (message.content === 'no') {
          await this.sessionService.updateSession(message.channel.id, message.author.id, session.context, messageIds);
          await this.sessionService.finishSession(message.channel.id, message.author.id);
          await message.react('👍');
          break;
        }

        if (message.content === 'yes') {
          await this.sessionService.finishSession(message.channel.id, message.author.id);
          const deleteMessageIds = [message.id, ...session.messageIds];
          await message.channel.bulkDelete(deleteMessageIds);
          break;
        }

        const message1 = (await message.channel.send('Either `yes` or `no` 🙂', { disableEveryone: true })) as Message;
        messageIds.push(message1.id);
        await this.sessionService.updateSession(message.channel.id, message.author.id, session.context, messageIds);

        break;
      }
    }
  }
}
