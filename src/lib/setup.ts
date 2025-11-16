import '@sapphire/plugin-logger/register';

process.env.NODE_ENV ??= 'development';

import { setup } from '@skyra/env-utilities';
import * as colorette from 'colorette';
import { Client, Events } from 'discord.js';
import { guildCreate } from './guildCreate.js';
import { guildDelete } from './guildDelete.js';

colorette.createColors({ useColor: true });

setup();

export function registerGuildListeners(client: Client): void {
	client.on(Events.GuildCreate, (guild) => guildCreate(guild, client));
	client.on(Events.GuildDelete, (guild) => guildDelete(guild, client));
}

declare module '@skyra/env-utilities' {
	interface Env {
		INDEX: string;
		SERVER_PATH: string;
	}
}