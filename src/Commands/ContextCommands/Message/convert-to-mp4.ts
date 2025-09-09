import type { MessageContextMenuCommandInteraction } from 'discord.js';
import MP4Converter from '../../../BaseClient/UtilModules/converter/MP4.js';
import TwitterToMP4 from '../../../BaseClient/UtilModules/converter/twitter/TwitterToMP4.js';

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
    const converter = new TwitterToMP4(embedWithVideo.video.url);
    const cdnUrl = await converter.convert();
    
    await interaction.followUp({
     content: `✅ Converted to MP4: ${cdnUrl}`
    });
    return;
   } catch (error) {
    console.error('Twitter MP4 conversion error:', error);
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Truncate error message if it's too long for Discord
    if (errorMessage.length > 1900) {
     errorMessage = errorMessage.substring(0, 1900) + '...';
    }
    await interaction.followUp({
     content: `❌ Failed to convert Twitter/X video: ${errorMessage}`,
     ephemeral: true
    });
    return;
   }
  }
 }
 
 // Check for attachments that are videos, GIFs, or have video extensions
 const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.gif'];
 const videoAttachment = message.attachments.find(att => {
  // Check content type
  if (att.contentType?.startsWith('video/') || att.contentType === 'image/gif') return true;
  // Check file extension as fallback (for files with generic content types)
  if (att.name && videoExtensions.some(ext => att.name!.toLowerCase().endsWith(ext))) return true;
  return false;
 });
 
 // Check for video embeds (Discord CDN videos)
 const videoEmbed = message.embeds.find(embed => embed.video?.url);
 
 // Check for URLs in message content
 const urlRegex = /(https?:\/\/[^\s]+)/g;
 const urls = message.content.match(urlRegex);
 
 let url: string | null = null;
 
 // Priority: 1) Video attachments, 2) Video embeds, 3) Video URLs in content
 if (videoAttachment) {
  url = videoAttachment.url;
 } else if (videoEmbed?.video?.url) {
  url = videoEmbed.video.url;
 } else if (urls && urls.length > 0) {
  // Try to find a YouTube or direct video URL
  url = urls.find(u => {
   if (u.includes('youtube.com') || u.includes('youtu.be')) return true;
   return videoExtensions.some(ext => u.toLowerCase().endsWith(ext));
  }) || null;
 }
 
 if (!url) {
  await interaction.followUp({
   content: '❌ No video URL or attachment found in this message. Supported formats: MP4, MOV, WEBM, AVI, MKV, FLV, WMV, M4V, GIF',
   ephemeral: true
  });
  return;
 }
 
 try {
  const converter = new MP4Converter(url);
  const cdnUrl = await converter.convert();
  
  await interaction.followUp({
   content: `✅ Converted to MP4: ${cdnUrl}`
  });
 } catch (error) {
  console.error('MP4 conversion error:', error);
  let errorMessage = error instanceof Error ? error.message : 'Unknown error';
  // Truncate error message if it's too long for Discord
  if (errorMessage.length > 1900) {
   errorMessage = errorMessage.substring(0, 1900) + '...';
  }
  await interaction.followUp({
   content: `❌ Failed to convert to MP4: ${errorMessage}`,
   ephemeral: true
  });
 }
};