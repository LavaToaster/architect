import Discord, { Guild } from 'discord.js';
import { Collection, Db } from 'mongodb';
import { boundMethod } from 'autobind-decorator';
import { Listener } from './listener';
import { injectable } from 'inversify';

interface GuildDocument {
  id: string;
  name: string;
  available: boolean;
  owner: string;
}

@injectable()
export class GuildListener implements Listener {
  private guilds: Collection<GuildDocument> = this.db.collection('guilds');

  constructor(private discord: Discord.Client, private db: Db) {}

  public async subscribe() {
    this.discord.on('guildUpdate', (_, newGuild) => this.handleGuildCreate(newGuild));
    this.discord.on('guildCreate', this.handleGuildCreate);
    this.discord.on('guildDelete', this.handleGuildCreate);
    this.discord.once('ready', this.handleReady);
  }

  @boundMethod
  private async handleReady() {
    const bulk = this.guilds.initializeUnorderedBulkOp();

    if (!(await this.guilds.indexExists('id'))) {
      await this.guilds.createIndex('id', { unique: true });
    }

    for (const guild of this.discord.guilds.array()) {
      bulk
        .find({ id: guild.id })
        .upsert()
        .update({
          $set: GuildListener.guildDocument(guild),
        });
    }

    await bulk.execute();
  }

  @boundMethod
  private async handleGuildCreate(guild: Guild) {
    await this.guilds.updateOne({ id: guild.id }, { $set: GuildListener.guildDocument(guild) });
  }

  private static guildDocument(guild: Guild): GuildDocument {
    return {
      id: guild.id,
      name: guild.name,
      available: guild.available,
      owner: guild.ownerID,
    };
  }
}
