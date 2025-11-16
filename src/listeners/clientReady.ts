import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type Store } from '@sapphire/framework';
import { envParseString } from '@skyra/env-utilities';
import { createBanner } from '@skyra/start-banner';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { retro } from 'gradient-string';
import { loadKazagumoEvents } from '../lib/kazagumo.js';
import figlet from 'figlet';

@ApplyOptions<Listener.Options>({ once: true })
export class UserListener extends Listener<typeof Events.ClientReady> {
	private readonly style = this.isDev ? yellow : blue;

	public async run() {
		await loadKazagumoEvents(this.container.client);
		this.printBanner();
		this.printStoreDebugInformation();
	}

	private get isDev() {
		return envParseString('NODE_ENV') === 'development';
	}

	private printBanner() {
		const success = green('+');

		const llc = this.isDev ? magentaBright : white;
		const blc = this.isDev ? magenta : blue;

		return console.log(
			createBanner({
				name: [retro.multiline(figlet.textSync(this.container.client.user!.username, { font: 'Slant' }))],
				extra: [`[${success}] Gateway`, this.isDev ? ` ${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : '']
			})
		);
	}

	private printStoreDebugInformation() {
		const { client } = this.container;
		const stores = [...client.stores.values()];
		const last = stores.pop()!;
		for (const store of stores) console.log(this.styleStore(store, false));
		return console.log(this.styleStore(last, true));
	}

	private styleStore(store: Store<any>, last: boolean) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
	}
}