import type { ChatInputCommandInteraction } from 'discord.js';
import MP4Converter from '../../../BaseClient/UtilModules/converter/MP4.js';

export default async (cmd: ChatInputCommandInteraction) => {
 const url = cmd.options.getString('url');
 if (!url) {
  await cmd.reply('Please provide a valid URL.');
  return;
 }

 // Defer reply with initial message
 await cmd.deferReply();

 const progressUpdates: string[] = ['> Initializing...'];
 
 // Send initial status
 await cmd.editReply({ 
  content: '🔄 **Converting to MP4**\n> Initializing...'
 });
 
 // Function to update progress
 const updateProgress = async (status: string) => {
  progressUpdates.push(`> ${status}`);
  // Keep only last 10 updates to avoid message being too long
  const recentUpdates = progressUpdates.slice(-10);
  
  try {
   await cmd.editReply({ 
    content: `🔄 **Converting to MP4**\n${recentUpdates.join('\n')}` 
   });
  } catch (e) {
   // Ignore edit errors (e.g., if message was deleted)
  }
 };

 try {
  const options = {
   onProgress: updateProgress
  };
  
  const cdnUrl = await new MP4Converter(url, options).convert();
  await cmd.editReply({ content: `✅ **Converted to MP4**: ${cdnUrl}` });
 } catch (error) {
  console.error('[MP4 Conversion Error]', error);
  await cmd.editReply({ content: '❌ Failed to convert video to MP4.' });
 }
};
