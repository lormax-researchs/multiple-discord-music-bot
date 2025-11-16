import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Context, MessageContext } from '../structures/Context.js';
import { Message, EmbedBuilder } from 'discord.js';
import { getI8n } from '../i8n/index.js';

/**
 * Tạo Embed thống nhất cho bot
 */
function createEmbed(description: string) {
	return new EmbedBuilder().setDescription(description);
}

@ApplyOptions<Command.Options>({
	description: 'Tiếp tục bài hát hiện tại'
})
export class ResumeCommand extends Command {

	public override async messageRun(message: Message, args: Args) {
		await this.execute(new MessageContext(message, args));
	}

	private async execute(message: Context) {
		const voiceChannel = message.member?.voice.channel;
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

		const player = message.client.kazagumo.getPlayer(message.guild!.id);

		if (!player || !player.queue.current) {
			// await send('Không có bài hát nào đang phát để tiếp tục.');
			return;
		}
		if (voiceChannel.id != player.voiceId) {
			return
		}

		player.pause(false);
		await send(getI8n('resumeSongs', { locale: message.guild.preferredLocale }));
	}
}
