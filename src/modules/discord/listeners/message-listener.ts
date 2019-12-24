import Discord, { Guild, Message } from 'discord.js';
import { Collection, MongoClient } from 'mongodb';
import { boundMethod } from 'autobind-decorator';
import { Listener } from './listener';
import yargs from 'yargs';
import fs from 'fs';
import { injectable } from 'inversify';

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

  constructor(private discord: Discord.Client, private mongo: MongoClient) {}

  public async subscribe() {
    this.discord.on('message', this.handleMessage);

    // const commands = new Discord.Collection();
    // const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter((file) => file.endsWith('.ts'));
    //
    // for (const file of commandFiles) {
    // }
  }

  @boundMethod
  private async handleMessage(message: Message) {
    // Prevent reading own messages
    if (message.author.id === this.discord.user.id) {
      return;
    }

    try {
      await this.messages.insertOne(MessageListener.messageDocument(message));
    } catch (e) {
      await message.reply(e.toString());
    }
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
