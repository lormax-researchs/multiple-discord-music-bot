import { Client, EmbedBuilder, Message } from 'discord.js';
import { getI8n } from '../i8n/index.js';

/**
 * Helper: tạo Embed thống nhất cho bot
 */
function createEmbed(description: string) {
	return new EmbedBuilder().setDescription(description);
}

export async function loadKazagumoEvents(client: Client) {
	// Shoukaku node events
	client.kazagumo.shoukaku.on('ready', (name) => client.logger.info(`Lavalink ${name}: Successfully connected.`));
	client.kazagumo.shoukaku.on('error', (name, error) => client.logger.error(`Lavalink ${name}: Error Caught,`, error));
	client.kazagumo.shoukaku.on('close', (name, code, reason) => client.logger.warn(`Lavalink ${name}: Closed, Code ${code}, Reason ${reason || 'No reason'}`)
	);
	client.kazagumo.shoukaku.on('debug', (name, info) => client.logger.debug(`Lavalink ${name}: Debug,`, info));
	client.kazagumo.shoukaku.on('disconnect', (name, _count) => {
		const players = [...client.kazagumo.shoukaku.players.values()].filter((p) => p.node.name === name);
		players.map((player) => {
			client.kazagumo.destroyPlayer(player.guildId);
			player.destroy();
		});
		client.logger.warn(`Lavalink ${name}: Disconnected`);
	});

	// Player events
	client.kazagumo.on('playerCreate', (player) => {
		client.logger.debug(`Player created for guild ${player.guildId}`);
	});

	client.kazagumo.on('playerDestroy', (player) => {
		client.handlePlay.sendEndCommand({ guildId: player.guildId });
		client.logger.debug(`Player destroyed for guild ${player.guildId}`);
	});

	client.kazagumo.on("playerMoved", (player, _, channel) => {
		if (!channel.newChannelId) {
			client.handlePlay.sendEndCommand({ guildId: player.guildId });
			return
		}
		client.handlePlay.sendMovedCommand({ guildId: player.guildId, channelId: channel.newChannelId });
	})

	client.on("voiceStateUpdate", (oldState, newState) => {
		// Only care about bot moving
		if (oldState.member?.user.id !== newState.member?.user.id || newState.member?.user.id !== client.user?.id) return
		if (oldState.channel != newState.channelId) {
			if (!newState.channel) if (oldState.member?.user.id === client.user?.id && newState.member?.user.id === client.user?.id) client.kazagumo.destroyPlayer(oldState.guild.id);
			if (!oldState.channel && newState.channel) return
			if (oldState.channel && newState.channel) {
				if (!newState.channel) {
					client.handlePlay.sendEndCommand({ guildId: oldState.guild.id });
				} else {
					client.handlePlay.sendMovedCommand({ guildId: oldState.guild.id, channelId: newState.channel.id });
				}
			}
		}
	})


	client.kazagumo.on('playerStart', async (player, track) => {
		if (!player.textId) return;
		const channel = client.channels.cache.get(player.textId);
		if (!channel || !channel.isSendable()) return;
		const guild = await client.guilds.fetch(player.guildId);
		if (player.data.get("message")) {
			(player.data.get("message") as Message | undefined)?.reply({
				embeds: [createEmbed(getI8n("playingSongEmbed", { locale: guild?.preferredLocale, variables: { title: track.title, author: track.author || "Unknown" } }))],
				content: getI8n("playingSong", { locale: guild?.preferredLocale, variables: { title: track.title, author: track.author || "Unknown" } }),
			}).then((msg) => player.data.set('message', msg));
		} else {
			channel
				?.send({
					embeds: [createEmbed(getI8n("playingSongEmbed", { locale: guild?.preferredLocale, variables: { title: track.title, author: track.author || "Unknown" } }))],
					content: getI8n("playingSong", { locale: guild?.preferredLocale, variables: { title: track.title, author: track.author || "Unknown" } }),
					files: []
				})
				.then((msg) => player.data.set('message', msg));
		}

	});

	client.kazagumo.on('playerEnd', async (player) => {
		player.data.get('message')?.edit({ embeds: [createEmbed(getI8n("playerEnded", { locale: (await client.guilds.fetch(player.guildId))?.preferredLocale }))], content: getI8n("playerEnded", { locale: (await client.guilds.fetch(player.guildId))?.preferredLocale }) });
	});

	client.kazagumo.on('playerEmpty', async (player) => {
		const lastTrack = (player.queue.current || player.queue.previous[0])!;
		if (player.data.get('autoplay')) {
			if (!player.textId) return;
			if (lastTrack.sourceName != "youtube") return
			const videoID = lastTrack.realUri?.split('=')[1];
			const result = await player.search(`${lastTrack.realUri}&list=RD${videoID}`, {
				requester: lastTrack.requester
			});
			if (!result.tracks.length) {
				player.destroy();
				if (!player.textId) return;
				const channel = client.channels.cache.get(player.textId);
				if (!channel || !channel.isSendable()) return;
				channel?.send({ embeds: [createEmbed(getI8n("playerEnded", { locale: (await client.guilds.fetch(player.guildId))?.preferredLocale }))] }).then((x) => player.data.set('message', x));
				return;
			}
			if (result.type === 'PLAYLIST') player.queue.add(result.tracks.slice(1));
			else player.queue.add(result.tracks[Math.floor(Math.random() * result.tracks.length)]!);
			if (!player.playing && !player.paused) await player.play();
			return;
		}

		// No autoplay → destroy player
		player.destroy();
		if (!player.textId) return;
		const channel = client.channels.cache.get(player.textId);
		if (!channel || !channel.isSendable()) return;
		channel?.send({ embeds: [createEmbed(getI8n("playerEnded", { locale: (await client.guilds.fetch(player.guildId))?.preferredLocale }))] }).then((x) => player.data.set('message', x));
	});
}