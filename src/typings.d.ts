import { config } from './config.ts';
import { Kazagumo } from 'kazagumo';
import { HandlePlay } from './structures/HandlePlay.ts';
declare module 'discord.js' {
	interface Client {
		config: typeof config;
		kazagumo: Kazagumo;
		handlePlay: HandlePlay;
	}
}