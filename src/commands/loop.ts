import { ApplyOptions } from '@sapphire/decorators';
import { Args, Awaitable, Command } from '@sapphire/framework';
import { Context, MessageContext } from '../structures/Context.js';
import { Message, EmbedBuilder } from 'discord.js';
import { getI8n } from '../i8n/index.js';

/**
 * Tạo một Embed thống nhất cho bot
 */
function createEmbed(description: string) {
	return new EmbedBuilder().setDescription(description);
}
const mapping: Record<string, 'none' | 'queue' | 'track'> = {
	off: 'none',
	none: 'none',
	all: 'queue',
	queue: 'queue',
	single: 'track',
	track: 'track'
};
@ApplyOptions<Command.Options>({
	description: 'Lặp lại bài hát',
	aliases: ['l']
})
export class LoopCommand extends Command {

	public override messageRun(message: Message, args: Args): Awaitable<unknown> {
		return this.execute(new MessageContext(message, args));
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


		const player = message.client.kazagumo.getPlayer(message.guild.id);

		if (!player) {
			// await send('Bot không kết nối với kênh voice.');
			return;
		}
		if (voiceChannel.id != player.voiceId) {
			return
		}
		let userInput = await message.args.pick('string').catch(() => null);

		if (!userInput) {
			await send(getI8n('notEnoughArguments', { locale: message.guild.preferredLocale, variables: { args: '`single`, `all` hoặc `off`' } }));
			return;
		}

		userInput = userInput.toLowerCase();

		const loopMode = mapping[userInput];

		if (!loopMode) {
			await send(getI8n('incorrectLoopMode', { locale: message.guild.preferredLocale }));
			return;
		}

		player.setLoop(loopMode);

		const msgByMode: Record<typeof loopMode, string> = {
			none: getI8n('loopModeNone', { locale: message.guild.preferredLocale }),
			track: getI8n('loopModeSingle', { locale: message.guild.preferredLocale }),
			queue: getI8n('loopModeAll', { locale: message.guild.preferredLocale })
		};

		await send(msgByMode[loopMode]);
	}
}
