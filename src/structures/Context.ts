import { Args } from '@sapphire/framework';
import {
	Message,
	MessageCreateOptions,
	MessagePayload
} from 'discord.js';

export class MessageContext {
	message: Message;
	isMessage(): this is MessageContext {
		return true;
	}

	constructor(
		message: Message,
		public args: Args
	) {
		this.message = message;
	}

	get guild() {
		return this.message.guild;
	}

	get client() {
		return this.message.client;
	}

	get author() {
		return this.message.author;
	}

	get channel() {
		return this.message.channel;
	}
	get id() {
		return this.message.id
	}

	get mentions() {
		return this.message.mentions;
	}

	get deletable() {
		return this.message.deletable;
	}

	get content() {
		return this.message.content;
	}

	get member() {
		return this.message.member;
	}

	reply(message: string | MessagePayload | MessageCreateOptions) {
		return this.message.reply(message);
	}

	send(message: string | MessagePayload | MessageCreateOptions) {
		if (!this.message.channel.isSendable()) {
			throw new Error('Channel is not sendable');
		}
		return this.message.channel.send(message);
	}

	delete() {
		if (this.message.deletable) return;
		return this.message.delete();
	}
}

export type Context = MessageContext;