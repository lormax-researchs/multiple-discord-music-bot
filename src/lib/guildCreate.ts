import { Guild } from 'discord.js';
import Client from '../structures/Client.js';

export async function guildCreate(guild: Guild, client: Client): Promise<void> {
  const data = { guildId: guild.id, guildName: guild.name, memberCount: guild.memberCount };
  client.handlePlay.sendGuildJoin(data);
}