import Discord, { Guild } from 'discord.js';
import { boundMethod } from 'autobind-decorator';
import { Listener } from './listener';
import { injectable } from 'inversify';
import { DiscordGuild, fromGuild } from '../../../models';

@injectable()
export class GuildListener implements Listener {
  constructor(private discord: Discord.Client) {}

  public async subscribe() {
    this.discord.on('guildUpdate', (_, newGuild) => this.handleGuildCreate(newGuild));
    this.discord.on('guildCreate', this.handleGuildCreate);
    this.discord.on('guildDelete', this.handleGuildCreate);
    this.discord.once('ready', this.handleReady);
  }

  @boundMethod
  private async handleReady() {
    let ops = [];

    for (const guild of this.discord.guilds.array()) {
      ops.push({
        updateOne: {
          filter: {
            _id: guild.id,
          },
          update: fromGuild(guild),
          upsert: true,
        },
      });
    }

    await DiscordGuild.bulkWrite(ops);
  }

  @boundMethod
  private async handleGuildCreate(guild: Guild) {
    await DiscordGuild.updateOne({ id: guild.id }, { $set: fromGuild(guild) }, { upsert: true });
  }
}
