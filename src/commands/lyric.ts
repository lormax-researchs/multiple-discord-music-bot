import { ApplyOptions } from '@sapphire/decorators';
import { Args, Awaitable, Command } from '@sapphire/framework';
import { Context, MessageContext } from '../structures/Context.js';
import { Message, EmbedBuilder } from 'discord.js';
import { getI8n } from '../i8n/index.js';
import lyricsSearcher from "../lib/Lyric.js";


/**
 * Tạo một Embed thống nhất cho bot
 */
function createEmbed(description: string) {
  return new EmbedBuilder().setDescription(description);
}
@ApplyOptions<Command.Options>({
  description: 'Hiển thị lời bài hát',
})
export class LyricCommand extends Command {

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

    if (!player.queue.current) {
      // await send('Không có bài hát nào đang phát.');
      await send(getI8n('emptyQueue', { locale: message.guild.preferredLocale }));
      return;
    }

    try {
      const lyrics = await lyricsSearcher(player.queue.current.title, player.queue.current.author || "");
      let lyricsEmbed = new EmbedBuilder()
        .setTitle(getI8n("lyricEmbedTitle", { locale: message.guild.preferredLocale, variables: { title: player.queue.current.title, author: player.queue.current.author || "" } }))
        .setDescription(lyrics.length >= 4096 ? `${lyrics.slice(0, 4093)}...` : lyrics)
      message.reply({ embeds: [lyricsEmbed] });
    } catch (error) {
      await send(getI8n('lyricNotFound', { locale: message.guild.preferredLocale }));
      return
    }
  }
}