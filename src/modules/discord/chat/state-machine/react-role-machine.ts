import { Message } from 'discord.js';
import emojiRegex from 'emoji-regex';
import { addReactionRole } from '../../../../repositories/discord-guild';
import { MachineConfig, nextState, sendMessage } from './machine';

interface RoleContext {
  roleId: string;
  emojiId: string;
  messageId: string;
  roles?: Array<{ id: string; name: string; position: number }>;
}

const CUSTOM_EMOJI_PATTERN = new RegExp(/^<a?:(\w+):(\w+)>$/);
const emoji = new RegExp(emojiRegex());

export const reactRoleMachine: MachineConfig<RoleContext> = {
  name: 'react-role',
  initial: 'start',
  final: 'done',
  cleanUp: true,
  states: {
    start: {
      message: '**Reaction Role Setup**\nMessage ID?',
      handle: async function*(message: Message, ctx) {
        if (message.content === 'help') {
          yield nextState('help');
          return;
        }

        const messageId = message.content;

        if (!(await message.channel.fetchMessage(messageId))) {
          yield sendMessage(`I can't find that message in this channel :(`);
          return;
        }

        ctx.messageId = messageId;

        yield nextState('role');
      },
    },
    role: {
      message: async function*(message: Message, ctx) {
        const roles = [];
        let roleText = '';

        let position = 1;

        for (const { id, name } of message.guild.roles.array()) {
          roles.push({ id, name, position });
          roleText += `${position}. ${name}\n`;

          position++;
        }

        ctx.roles = roles;

        yield `Select Role:\n\n${roleText}\nPlease reply with the number of the role.`;
      },
      handle: async function*(message: Message, ctx) {
        const pos = parseInt(message.content);
        const role = ctx.roles!.find(({ position }) => pos === position);

        if (!role) {
          yield sendMessage('Invalid role 😢');
          return;
        }

        ctx.roleId = role.id;

        yield nextState('emoji');
      },
    },
    emoji: {
      message: 'Enter Emoji:',
      handle: async function*(message: Message, ctx) {
        const content = message.content;
        const [match1, name, id] = content.match(CUSTOM_EMOJI_PATTERN) || [];
        const matchedEmoji = content.match(emoji) || [];

        if (matchedEmoji.length > 1 || (matchedEmoji.length > 0 && id)) {
          yield sendMessage(`Too many emoji 😖 - I confuse easily please only use one.`);
          return;
        }

        const emojiId = id || matchedEmoji[0];

        if (!emojiId) {
          yield sendMessage(
            `That doesn't look like a valid emoji to me or you've sent me too many ☹️.\nPlease try again:`,
          );
          return;
        }

        // add to the database
        await addReactionRole(message.guild.id, {
          emoji: emojiId,
          roleId: ctx.roleId,
        });

        // react to the message
        const roleMessage = await message.channel.fetchMessage(ctx.messageId);
        await roleMessage.react(message.content);

        yield sendMessage(`That's all done for you :)`);
        yield nextState('done');
      },
    },
  },
};
