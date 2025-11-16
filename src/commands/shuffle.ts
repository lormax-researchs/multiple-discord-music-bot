import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Context, MessageContext } from '../structures/Context.js';
import { Message, EmbedBuilder } from 'discord.js';
import { getI8n } from '../i8n/index.js';

/**
 * Tạo một Embed thống nhất cho bot
 * @param description Nội dung mô tả
 */
function createEmbed(description: string) {
  return new EmbedBuilder().setDescription(description);
}

@ApplyOptions<Command.Options>({
  description: 'Trộn bài hát trong hàng chờ'
})
export class PauseCommand extends Command {

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
      // await send('Không có bài hát nào đang phát để tạm dừng.');
      return;
    }
    if (voiceChannel.id != player.voiceId) {
      return
    }

    player.queue.shuffle();
    await send(getI8n('shuffledQueue', { locale: message.guild.preferredLocale }));
  }
}
