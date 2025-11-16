import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message, EmbedBuilder } from 'discord.js';
import { Context, MessageContext } from '../structures/Context.js';
import { getI8n } from '../i8n/index.js';

/**
 * Tạo một Embed thống nhất cho bot
 * @param description Nội dung mô tả
 */
function createEmbed(description: string) {
	return new EmbedBuilder().setDescription(description);
}

@ApplyOptions<Command.Options>({
	description: 'Bỏ qua bài hát hiện tại',
	aliases: ['s']
})
export class SkipCommand extends Command {

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
			// await send('Bot không kết nối với kênh voice nào.');
			return;
		}

		if (!player.queue.current) {
			await send(getI8n("emptyQueue", { locale: message.guild.preferredLocale }));
			return;
		}
		if (voiceChannel.id != player.voiceId) {
			return
		}

		player.skip();
		await send(getI8n('skippedSong', { locale: message.guild.preferredLocale }));
	}
}
