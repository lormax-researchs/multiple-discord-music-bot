import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, Message } from 'discord.js';
import { getI8n } from '../i8n/index.js';
import { Context, MessageContext } from '../structures/Context.js';

/**
 * Tạo một Embed thống nhất cho bot
 * @param description Nội dung mô tả
 */
function createEmbed(description: string) {
	return new EmbedBuilder().setDescription(description);
}


@ApplyOptions<Command.Options>({
	name: 'nowplaying',
	description: 'Hiển thị bài hát đang phát',
	aliases: ['np']
})
export class NowPlayingCommand extends Command {

	public override async messageRun(msg: Message, args: Args) {
		await this.execute(new MessageContext(msg, args));
	}

	private async execute(message: Context) {
		const voiceChannel = message.member?.voice.channel;

		// Helper gửi embed nhanh gọn
		const send = (content: string) => message.reply({ embeds: [createEmbed(content)] });

		if (!message.client.user) return;

		if (!message.guild) {
			await send(getI8n('userNotInGuild'));
			return;
		}

		if (!message.channel) {
			await send(getI8n('userNotInChanel', { locale: message.guild.preferredLocale }));
			return;
		}

		if (!voiceChannel) {
			process.env.INDEX == "0" && await send(getI8n('userNotInVoiceChannel', { locale: message.guild.preferredLocale }));
			return;
		}

		const player = message.client.kazagumo.getPlayer(message.guild.id);

		if (!player) {
			return;
		}
		if (voiceChannel.id != player.voiceId) {
			return
		}
		const { queue } = player;
		const currentTrack = queue.current;

		if (!currentTrack) {
			await send(getI8n('noSongsInQueue', { locale: message.guild.preferredLocale }));
			return;
		}

		player.data.set("message", await message.send({ content: getI8n('currentPlaying', { locale: message.guild.preferredLocale, variables: { title: currentTrack.title, author: currentTrack.author || "Unknown" } }), embeds: [createEmbed(currentTrack.title)] }));
	}




}
