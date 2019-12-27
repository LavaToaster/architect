import Discord, { Message } from 'discord.js';
import { Collection, Db } from 'mongodb';
import { boundMethod } from 'autobind-decorator';
import { Listener } from './listener';
import yargs from 'yargs';
import fs from 'fs';
import { Container, injectable } from 'inversify';
import { BotCommand, NewableBotCommand } from '../bot-command';
import { SessionService } from '../servies/session-service';

interface MessageDocument {
  id: string;
  authorId: string;
  content: string;
  guildId: string;
  channelId: string;
  response: string;
  createdAt: Date;
}

@injectable()
export class MessageListener implements Listener {
  private messages: Collection<MessageDocument> = this.db.collection('messages');
  private commands = new Discord.Collection<string, BotCommand>();

  constructor(
    private discord: Discord.Client,
    private db: Db,
    private container: Container,
    private sessionService: SessionService,
  ) {}

  public async subscribe() {
    let commandsFolder = `${__dirname}/../commands`;
    let commandFiles = fs.readdirSync(`${commandsFolder}`).filter((file) => file.endsWith('.ts'));

    for (let file of commandFiles) {
      const command: NewableBotCommand = (await import(`${commandsFolder}/${file}`)).default;

      this.commands.set(command.signature, this.container.resolve(command));
    }

    this.discord.on('message', this.handleMessage);
  }

  @boundMethod
  private async handleMessage(message: Message) {
    // Prevent reading own messages
    if (message.author.id === this.discord.user.id) {
      return;
    }

    const session = await this.sessionService.getActiveSession(message.channel.id, message.author.id);

    if (session) {
      const command: BotCommand = this.commands.get(session.cmd)!;
      await command.handleSession!(message, session);

      return;
    }

    const parsed = yargs.parse(message.content);
    const [prefix, commandName, ...args] = parsed._;

    if (!['!astra', `<@!${message.client.user.id}>`].includes(prefix)) {
      return;
    }

    if (commandName === 'help') {
      await message.reply(`Possible commands are: ${this.commands.keyArray().join(', ')}.`);
      return;
    }

    if (this.commands.has(commandName)) {
      const command: BotCommand = this.commands.get(commandName)!;
      await command.handleMessage(message, args);

      return;
    }

    console.log(args);

    // log incoming message
    await this.messages.insertOne(MessageListener.messageDocument(message));
  }

  private static messageDocument(message: Message): MessageDocument {
    return {
      id: message.id,
      authorId: message.author.id,
      content: message.content,
      guildId: message.guild.id,
      channelId: message.channel.id,
      response: message.content,
      createdAt: message.createdAt,
    };
  }
}
