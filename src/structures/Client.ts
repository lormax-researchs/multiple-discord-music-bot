import { SapphireClient } from '@sapphire/framework';
import { ActivityType, DiscordAPIError } from 'discord.js';
import { Kazagumo, Plugins } from 'kazagumo';
import { Connectors } from 'shoukaku';
import { HandlePlay } from './HandlePlay.js';
import { config, LavalinkNodes } from '../config.js';
import { registerGuildListeners } from '../lib/setup.js';

export default class extends SapphireClient {
	public constructor() {
		super({
			intents: 3276799,
			allowedMentions: {
				repliedUser: false
			},
			presence: {
				activities: [
					{
						name: 'Lormas Studio',
						type: ActivityType.Watching
					}
				],
				status: 'online'
			},
			loadMessageCommandListeners: true,
			enableLoaderTraceLoggings: true,
			defaultPrefix: config.prefix
		});

		this.config = config;
		this.kazagumo = new Kazagumo(
			{
				plugins: [new Plugins.PlayerMoved(this)],
				defaultSearchEngine: 'youtube',
				send: (guildId, payload) => {
					const guild = this.guilds.cache.get(guildId);
					if (!guild) return;

					try {
						guild.shard.send(payload);
					} catch (error) {
						if (error instanceof DiscordAPIError && error.code === 50013) {
							console.error('[MissingPermissions]', error);
							// Tùy ý: thông báo vào console hoặc 1 kênh log riêng
							return; // đừng ném lại => tiến trình không thoát
						}
						throw error; // lỗi khác vẫn để bung ra
					}
				}
			},
			new Connectors.DiscordJS(this),
			LavalinkNodes,
			{
				moveOnDisconnect: false,
				resumeByLibrary: true,
				resumeTimeout: 60,
				reconnectTries: 3,
				restTimeout: 60
			}
		);
		this.handlePlay = new HandlePlay(this);

		registerGuildListeners(this);

		// đặt ở file khởi động (ví dụ index.js) – làm càng sớm càng tốt
		process.on('unhandledRejection', (reason, promise) => {
			console.error('[UnhandledRejection]', promise, reason);
		});
		process.on('uncaughtException', (err) => {
			console.error('[UncaughtException]', err);
		});
		process.on('uncaughtExceptionMonitor', (err) => {
			console.error('[UncaughtExceptionMonitor]', err);
		});
		this.on('error', console.error);
		this.on('warn', console.warn);
		this.on('shardError', (error) => {
			console.error('[ShardError]', error);
		});
	}
}