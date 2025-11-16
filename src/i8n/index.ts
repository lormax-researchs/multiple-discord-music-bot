import { Locale } from 'discord.js';
import en from './en.js';
import { I8n } from './types.js';
import vi from './vi.js';

export const i8n = {
  "en-GB": en,
  "en-US": en,
  "default": vi,
  "vi": vi
} satisfies Partial<Record<Locale | 'default', I8n>>;

export const getI8n = (action: keyof I8n, config: { variables?: Record<string, string>, locale?: Locale | 'default' } = {}) => {
  const message = config.locale ? config.locale in i8n ? i8n[config.locale as keyof typeof i8n][action] : i8n['default'][action] : i8n['default'][action];

  return config.variables ? message.replace(/{(\w+)}/g, (_, k) => config.variables ? config.variables[k] || `{${k}}` : `{${k}}`) : message
}