import './lib/setup.js';

import Client from './structures/Client.js';

const client = new Client();
await client.login();