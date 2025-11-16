import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, User } from 'discord.js';
import { Context, MessageContext } from '../structures/Context.js';
import { getI8n } from '../i8n/index.js';

const itemsPerPage = 15;

/**
 * Tạo một Embed thống nhất cho các thông báo đơn giản
 */
function createEmbed(description: string) {
	return new EmbedBuilder().setDescription(description);
}

@ApplyOptions<Command.Options>({
	name: 'queue',
	description: 'Hiển thị danh sách phát hiện tại',
	aliases: ['q']
})
export class QueueCommand extends Command {

	public override async messageRun(msg: Message, args: Args) {
		await this.execute(new MessageContext(msg, args));
	}

	private async execute(message: Context) {
		const send = (content: string) => message.reply({ embeds: [createEmbed(content)] });

		if (!message.guild) {
			await send(getI8n('userNotInGuild'));
			return;
		}
		const voiceChannel = message.member?.voice.channel;
		const player = message.client.kazagumo.getPlayer(message.guild.id);
		if (!player) {
			// await send('Bot không kết nối với kênh voice nào.');
			return;
		}
		if (!voiceChannel) {
			process.env.INDEX == "0" && await send(getI8n('userNotInVoiceChannel', { locale: message.guild.preferredLocale }));
			return;
		}
		if (voiceChannel.id != player.voiceId) {
			return
		}



		const { queue } = player;
		if (queue.size === 0) {
			await send(getI8n('emptyQueue', { locale: message.guild.preferredLocale }));
			return;
		}

		let currentPage = 0;
		const totalPages = Math.ceil(queue.length / itemsPerPage);

		const generateQueueEmbed = (page: number) => {
			const start = page * itemsPerPage;
			const end = start + itemsPerPage;
			const currentQueue = queue.slice(start, end);

			return new EmbedBuilder()
				.setTitle('Hàng đợi hiện tại')

				.setDescription(
					currentQueue.length === 0
						? getI8n('emptyQueue', { locale: message.guild?.preferredLocale })
						: currentQueue
							.map((song, index) => `${start + index + 1}. [${song.title}](${song.realUri}) - <@${(song.requester as User).id}>`)
							.join('\n')
				)
				.setFooter({ text: `Page ${page + 1} / ${totalPages}` });
		};

		const generateActionRow = (page: number) =>
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId('prev')
					.setLabel('⏮️')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === 0),
				new ButtonBuilder()
					.setCustomId('next')
					.setLabel('⏭️')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === totalPages - 1)
			);

		const msg = await message.send({
			embeds: [generateQueueEmbed(currentPage)],
			components: [generateActionRow(currentPage)]
		});

		const collector = msg.createMessageComponentCollector({
			filter: (interaction) => ['prev', 'next'].includes(interaction.customId) && interaction.user.id === message.author.id,
			time: 60000
		});

		collector.on('collect', async (interaction) => {
			if (interaction.customId === 'prev') currentPage--;
			if (interaction.customId === 'next') currentPage++;

			await interaction.update({
				embeds: [generateQueueEmbed(currentPage)],
				components: [generateActionRow(currentPage)]
			});
		});

		collector.on('end', () => {
			void msg.edit({ components: [] });
		});
	}
}
