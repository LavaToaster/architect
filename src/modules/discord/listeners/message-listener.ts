import Discord, { Guild, Message } from 'discord.js';
import { Collection, MongoClient } from 'mongodb';
import { boundMethod } from 'autobind-decorator';
import { Listener } from './listener';
import yargs from 'yargs';
import fs from 'fs';
import { injectable } from 'inversify';
import { withScope } from '@sentry/node';

interface GuildDocument {
  id: string;
  name: string;
  available: boolean;
  owner: string;
}

interface MessageDocument {
  id: string;
  author: string;
  content: string;
  guildId: string;
  channelId: string;
  response: string;
  createdAt: Date;
}

@injectable()
export class MessageListener implements Listener {
  private messages: Collection<MessageDocument> = this.mongo.db().collection('messages');
  private commands = new Discord.Collection();

  constructor(private discord: Discord.Client, private mongo: MongoClient) {}

  public async subscribe() {
    let commandsFolder = `${__dirname}/../commands`;
    let commandFiles = fs.readdirSync(`${commandsFolder}`).filter((file) => file.endsWith('.ts'));

    for (let file of commandFiles) {
      const command = (await import(`${commandsFolder}/${file}`)).default;

      this.commands.set(command.signature, new command);
    }

    this.discord.on('message', this.handleMessage);
  }

  @boundMethod
  private async handleMessage(message: Message) {
    // Prevent reading own messages
    if (message.author.id === this.discord.user.id) {
      return;
    }

    // TODO: Session code!

    const parsed = yargs.parse(message.content);
    const [prefix, commandName, ...args] = parsed._;

    if (!['!astra', `<@!${message.client.user.id}>`].includes(prefix)) {
      return;
    }

    if (this.commands.has(commandName)) {
      const command: any = this.commands.get(commandName);
      await command.run(message);

      return;
    }

    console.log(args);

    // log incoming message
    await this.messages.insertOne(MessageListener.messageDocument(message));
  }

  private static messageDocument(message: Message): MessageDocument {
    return {
      id: message.id,
      author: message.author.id,
      content: message.content,
      guildId: message.guild.id,
      channelId: message.channel.id,
      response: message.content,
      createdAt: message.createdAt,
    };
  }
}
