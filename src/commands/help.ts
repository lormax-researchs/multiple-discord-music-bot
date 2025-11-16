import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, Message } from 'discord.js';

@ApplyOptions<Command.Options>({
  description: 'Hiển thị hướng dẫn sử dụng bot',
  detailedDescription: 'Hướng dẫn chi tiết về cách sử dụng bot'
})
export class HelpCommand extends Command {

  public override async messageRun(message: Message, _args: Args) {
    if (process.env.INDEX != "0") return;
    const commands = [...this.container.client.stores.get("commands").values()];
    const embed = new EmbedBuilder()
      .setTitle('✨ Danh Sách Lệnh ✨')
      .setDescription(`Chào mừng đến với danh sách lệnh của **${this.container.client.user?.username}**!`)
      .addFields(
        commands.map(command => ({
          name: `${this.container.client.config.prefix}${command.name}`,
          value: `> ${command.description}`, // Adding a subtle indent
          inline: false
        }))
      )
      .setFooter({ text: 'Sử dụng ' + `${this.container.client.config.prefix}<lệnh>` + ' để chạy lệnh' });

    return message.reply({ embeds: [embed] });
  }
}