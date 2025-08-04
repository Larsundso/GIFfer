import type { MessageContextMenuCommandInteraction } from 'discord.js';
import GIFConverter from '../../../BaseClient/UtilModules/converter/GIF.js';
import TwitterToGIF from '../../../BaseClient/UtilModules/converter/twitter/TwitterToGIF.js';

export default async (interaction: MessageContextMenuCommandInteraction) => {
 await interaction.deferReply();

 // Get the message that was right-clicked
 const message = interaction.targetMessage;
 
 // Check if this is a Twitter/X message with video embed
 const twitterDomains = ['twitter.com', 'x.com', 'fixupx.com', 'fixvx.com', 'vxtwitter.com', 'fixuptwitter.com', 'fxtwitter.com'];
 const hasTwitterUrl = twitterDomains.some(domain => message.content.includes(domain));
 
 if (hasTwitterUrl && message.embeds.length > 0) {
  // Check for video in embeds (Twitter/X fix services provide this)
  const embedWithVideo = message.embeds.find(embed => embed.video?.url);
  
  if (embedWithVideo?.video?.url) {
   try {
    const converter = new TwitterToGIF(embedWithVideo.video.url);
    const file = await converter.convert();
    
    await interaction.followUp({
     content: `✅ Converted Twitter/X video to GIF from [this message](${message.url})`,
     files: [file]
    });
    return;
   } catch (error) {
    console.error('Twitter GIF conversion error:', error);
    await interaction.followUp({
     content: `❌ Failed to convert Twitter/X video: ${error instanceof Error ? error.message : 'Unknown error'}`,
     ephemeral: true
    });
    return;
   }
  }
 }
 
 // Check for attachments that are videos
 const videoAttachment = message.attachments.find(
  att => att.contentType?.startsWith('video/') || att.contentType === 'image/gif'
 );
 
 // Check for URLs in message content
 const urlRegex = /(https?:\/\/[^\s]+)/g;
 const urls = message.content.match(urlRegex);
 
 let url: string | null = null;
 
 if (videoAttachment) {
  url = videoAttachment.url;
 } else if (urls && urls.length > 0) {
  // Try to find a YouTube or video URL
  url = urls.find(u => 
   u.includes('youtube.com') || 
   u.includes('youtu.be') || 
   u.endsWith('.mp4') || 
   u.endsWith('.webm') ||
   u.endsWith('.mov') ||
   u.endsWith('.avi')
  ) || urls[0];
 }
 
 if (!url) {
  await interaction.followUp({
   content: '❌ No video URL or attachment found in this message.',
   ephemeral: true
  });
  return;
 }
 
 try {
  const converter = new GIFConverter(url);
  const file = await converter.convert();
  
  await interaction.followUp({
   files: [file]
  });
 } catch (error) {
  console.error('GIF conversion error:', error);
  await interaction.followUp({
   content: `❌ Failed to convert to GIF: ${error instanceof Error ? error.message : 'Unknown error'}`,
   ephemeral: true
  });
 }
};