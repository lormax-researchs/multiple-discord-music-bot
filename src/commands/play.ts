import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, } from 'discord.js';
import { Context, MessageContext } from '../structures/Context.js';
import { getI8n } from '../i8n/index.js';

/**
 * Embed helper
 */
function createEmbed(description: string) {
	return new EmbedBuilder().setDescription(description);
}

@ApplyOptions<Command.Options>({
	description: 'Phát một bài hát',
	aliases: ['p']
})
export class PlayCommand extends Command {

	public override async messageRun(msg: Message, args: Args) {
		await this.execute(new MessageContext(msg, args));
	}

	private async execute(message: Context) {
		const send = (content: string) => message.reply({ embeds: [createEmbed(content)] });

		// --- guild / channel / voice checks ---
		const voiceChannel = message.member?.voice.channel;
		if (!message.client.user) return;
		if (!message.guild) return await send(getI8n('userNotInGuild'));
		if (!message.channel) return await send(getI8n('userNotInChanel', { locale: message.guild.preferredLocale }));
		if (!voiceChannel) return process.env.INDEX == "0" && await send(getI8n('userNotInVoiceChannel', { locale: message.guild.preferredLocale }));

		// --- get query ---
		const query = await message.args.rest('string').catch(() => null);
		if (!query) return process.env.INDEX == "0" && await send(getI8n('missingQuery', { locale: message.guild.preferredLocale }));

		if (process.env.INDEX != "0") return;
		// --- search ---
		const search = await message.client.kazagumo.search(query, { requester: message.author });
		if (!search.tracks.length) return process.env.INDEX == "0" && await send(getI8n('noResults', { locale: message.guild.preferredLocale }));

		// --- ensure player ---
		let player = message.client.kazagumo.getPlayer(message.guild.id);


		// --------------
		//  AUTO-SELECT   (URL hoặc Playlist) → thêm thẳng
		//  ASK USER      (tìm kiếm) → hiển thị top 5 để chọn
		// --------------
		if (search.type === 'PLAYLIST' || search.tracks.length === 1) {
			// --- add track ---
			if (search.type === 'PLAYLIST') {
				if (player && player.voiceId == voiceChannel.id) {
					player.queue.add(search.tracks);
					if (!player.playing && !player.paused) await player.play()
					return await send(getI8n('addedPlaylistToQueue', { locale: message.guild.preferredLocale, variables: { playlist_name: search.playlistName || search.tracks[0].title, num_of_songs: `${search.tracks.length || 1}` } }));
				}
				else
					message.client.handlePlay.sendPlayCommand({
						guildId: message.guild.id,
						textChannelId: message.channel.id,
						voiceChannelId: voiceChannel.id,
						query,
						messageId: message.id,
						offererId: message.author.id
					})
			} else {
				if (player && player.voiceId == voiceChannel.id) {
					player.queue.add(search.tracks[0]);
					if (!player.playing && !player.paused) await player.play();

					return await send(getI8n('addedSongToQueue', {
						locale: message.guild.preferredLocale, variables: {
							song_title: search.tracks[0].title, song_author: search.tracks[0].author || "Unknown"
						}
					}));
				}
				else message.client.handlePlay.sendPlayCommand({
					guildId: message.guild.id,
					textChannelId: message.channel.id,
					voiceChannelId: voiceChannel.id,
					query,
					messageId: message.id,
					offererId: message.author.id
				})
			}
			return
		}


		if (process.env.INDEX == "0") {
			// ----------
			// Cho người dùng chọn bài hát dựa trên kết quả tìm kiếm (hiện tối đa 5 kết quả)
			// ----------

			const top = search.tracks.slice(0, 5);
			const description = top.map((t, i) => `${i + 1}. **${t.title}** · ${t.author}`).join('\n');

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				top.map((_, i) =>
					new ButtonBuilder()
						.setCustomId(`pick_${i}`)
						.setLabel(`${i + 1}`)
						.setStyle(ButtonStyle.Primary)
				)
			);

			const prompt = await message.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription(description)
				],
				components: [row]
			});

			try {
				const interaction = await prompt.awaitMessageComponent({
					filter: (i) => i.user.id === message.author.id,
					componentType: ComponentType.Button,
					time: 60000
				});

				const index = parseInt(interaction.customId.replace('pick_', ''), 10);
				const track = top[index];
				if (player && player.voiceId == voiceChannel.id) {
					player.queue.add(track);
					if (!player.playing && !player.paused) await player.play();
					return await interaction.update({
						embeds: [createEmbed(getI8n('addedSongToQueue', { locale: message.guild.preferredLocale, variables: { song_title: track.title, song_author: track.author || "Unknown" } }))],
						components: []
					});
				}
				else message.client.handlePlay.sendPlayCommand({
					guildId: message.guild.id,
					textChannelId: message.channel.id,
					voiceChannelId: voiceChannel.id,
					query: track.uri!,
					messageId: message.id,
					offererId: message.author.id
				})
				return interaction.update({
					embeds: [createEmbed(getI8n('addedSongToQueue', { locale: message.guild.preferredLocale, variables: { song_title: track.title, song_author: track.author || "Unknown" } }))],
					components: []
				})

			} catch {
				// Hết giờ hoặc error
				await prompt.edit({ components: [] });
				await send('Đã hết thời gian chọn bài, hãy thử lại!');
			}
		}
		return
	}
}