import type { ChatInputCommandInteraction } from 'discord.js';
import GIFConverter from '../../../BaseClient/UtilModules/converter/GIF.js';

export default async (cmd: ChatInputCommandInteraction) => {
 const url = cmd.options.getString('url');
 await cmd.deferReply();

 if (!url) {
  await cmd.reply('Please provide a valid URL.');
  return;
 }

 await new GIFConverter(url).convert().then((file) => cmd.followUp({ files: [file] }));
};
