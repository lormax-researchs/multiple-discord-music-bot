import { Guild } from 'discord.js';
import Client from '../structures/Client.js';

export async function guildDelete(guild: Guild, client: Client): Promise<void> {
  const data = { guildId: guild.id };
  client.handlePlay.sendGuildLeave(data);
}