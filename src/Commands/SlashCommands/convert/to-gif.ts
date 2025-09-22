import type { ChatInputCommandInteraction } from 'discord.js';
import GIFConverter from '../../../BaseClient/UtilModules/converter/GIF.js';

function parseTimeToSeconds(timeStr: string | null): number | null {
 if (!timeStr) return null;
 
 // Handle MM:SS or M:SS format
 if (timeStr.includes(':')) {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
   const minutes = parseInt(parts[0], 10);
   const seconds = parseInt(parts[1], 10);
   if (!isNaN(minutes) && !isNaN(seconds)) {
    return minutes * 60 + seconds;
   }
  }
 }
 
 // Handle plain seconds
 const seconds = parseInt(timeStr, 10);
 return isNaN(seconds) ? null : seconds;
}

export default async (cmd: ChatInputCommandInteraction) => {
 const url = cmd.options.getString('url');
 const startTime = cmd.options.getString('start');
 const endTime = cmd.options.getString('end');
 const fps = cmd.options.getInteger('fps') || 15;
 
 if (!url) {
  await cmd.reply('Please provide a valid URL.');
  return;
 }

 // Defer reply with initial message
 await cmd.deferReply();

 const progressUpdates: string[] = ['> Initializing...'];
 
 // Send initial status
 await cmd.editReply({ 
  content: '🔄 **Converting to GIF**\n> Initializing...'
 });
 
 // Function to update progress
 const updateProgress = async (status: string) => {
  console.log(`[Progress Update] ${status}`);
  progressUpdates.push(`> ${status}`);
  // Keep only last 10 updates to avoid message being too long
  const recentUpdates = progressUpdates.slice(-10);
  
  try {
   await cmd.editReply({ 
    content: `🔄 **Converting to GIF**\n${recentUpdates.join('\n')}` 
   });
  } catch (e) {
   console.error('[Progress Update Error]', e);
  }
 };

 try {
  const options = {
   start: parseTimeToSeconds(startTime),
   end: parseTimeToSeconds(endTime),
   fps,
   onProgress: updateProgress
  };
  
  const cdnUrl = await new GIFConverter(url, options).convert();
  await cmd.editReply({ content: `✅ **Converted to GIF**: ${cdnUrl}` });
 } catch (error) {
  console.error('[GIF Conversion Error]', error);
  await cmd.editReply({ content: '❌ Failed to convert video to GIF. The video might be too long or the conversion timed out.' });
 }
};
