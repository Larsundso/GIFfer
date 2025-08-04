import type { AutocompleteInteraction, Guild } from 'discord.js';

export interface AutoCompleteFile {
 default: (
  cmd: AutocompleteInteraction | { guild: Guild },
 ) => Promise<{ name: string; value: string }[] | undefined>;
}
