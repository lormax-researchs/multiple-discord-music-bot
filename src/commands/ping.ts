import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'ping pong'
})
export class UserCommand extends Command {

	public override async messageRun(msg: Message, _args: Args) {
		// Send initial ping message
		const pingMessage = await msg.reply({ content: 'Pinging...' });

		return pingMessage.edit({ content: `Pong! \`${this.container.client.ws.ping}ms\`` });
	}
}