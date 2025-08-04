import type { ChatInputCommandInteraction } from 'discord.js';
import MP4Converter from '../../../BaseClient/UtilModules/converter/MP4.js';

export default async (cmd: ChatInputCommandInteraction) => {
 const url = cmd.options.getString('url');
 await cmd.deferReply();

 if (!url) {
  await cmd.reply('Please provide a valid URL.');
  return;
 }

 const cdnUrl = await new MP4Converter(url).convert();
 await cmd.followUp({ content: `✅ Converted to MP4: ${cdnUrl}` });
};
