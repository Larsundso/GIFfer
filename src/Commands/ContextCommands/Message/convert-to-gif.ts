import type { MessageContextMenuCommandInteraction } from 'discord.js';
import GIFConverter from '../../../BaseClient/UtilModules/converter/GIF.js';
import TwitterToGIF from '../../../BaseClient/UtilModules/converter/twitter/TwitterToGIF.js';

export default async (interaction: MessageContextMenuCommandInteraction) => {
 await interaction.deferReply();
 
 // Send initial message
 await interaction.editReply({
  content: '🔄 **Converting to GIF**\n> Analyzing message...'
 });

 // Get the message that was right-clicked
 const message = interaction.targetMessage;
 
 // Check if this is a Twitter/X message with video embed
 const twitterDomains = ['twitter.com', 'x.com', 'fixupx.com', 'fixvx.com', 'vxtwitter.com', 'fixuptwitter.com', 'fxtwitter.com'];
 const hasTwitterUrl = twitterDomains.some(domain => message.content.includes(domain));
 
 if (hasTwitterUrl && message.embeds.length > 0) {
  // Check for video in embeds (Twitter/X fix services provide this)
  const embedWithVideo = message.embeds.find(embed => embed.video?.url);
  
  if (embedWithVideo?.video?.url) {
   await interaction.editReply({ 
    content: '🔄 **Converting Twitter/X video to GIF**\n> Initializing...'
   });
   
   const progressUpdates: string[] = ['> Initializing...'];
   const updateProgress = async (status: string) => {
    progressUpdates.push(`> ${status}`);
    const recentUpdates = progressUpdates.slice(-10);
    try {
     await interaction.editReply({ 
      content: `🔄 **Converting Twitter/X video to GIF**\n${recentUpdates.join('\n')}` 
     });
    } catch (e) {}
   };
   
   try {
    const converter = new TwitterToGIF(embedWithVideo.video.url, updateProgress);
    const cdnUrl = await converter.convert();
    
    await interaction.editReply({
     content: `✅ **Converted Twitter/X video to GIF**: ${cdnUrl}`
    });
    return;
   } catch (error) {
    console.error('Twitter GIF conversion error:', error);
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Truncate error message if it's too long for Discord
    if (errorMessage.length > 1900) {
     errorMessage = errorMessage.substring(0, 1900) + '...';
    }
    await interaction.editReply({
     content: `❌ Failed to convert Twitter/X video: ${errorMessage}`
    });
    return;
   }
  }
 }
 
 // Check for attachments that are videos or have video extensions
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
 
 await interaction.editReply({ 
  content: '🔄 **Converting to GIF**\n> Initializing...'
 });
 
 // Track ILoveIMG task URL when available
 let iloveimgTaskUrl: string | undefined;
 
 // Set up 14-minute timeout handler
 let conversionComplete = false;
 const timeoutHandler = setTimeout(async () => {
  if (!conversionComplete) {
   try {
    const timeoutMessage = iloveimgTaskUrl
      ? `⏳ **Conversion still in progress**\nThis is taking longer than expected. The file should be available soon at:\n${iloveimgTaskUrl}\n\n⚠️ **Note:** ILoveIMG files expire after a short time. Please download your file immediately when it's ready!`
      : `⏳ **Conversion still in progress**\nThis is taking longer than expected. The process will continue in the background.\n\n⚠️ **Note:** Please wait for the final link to appear.`;
    await interaction.editReply({ 
     content: timeoutMessage
    });
   } catch (e) {
    console.error('[14-minute timeout update failed]', e);
   }
  }
 }, 14 * 60 * 1000); // 14 minutes
 
 const progressUpdates: string[] = ['> Initializing...'];
 const updateProgress = async (status: string) => {
  // Check if this is the ILoveIMG task URL
  if (status.includes('ILOVEIMG_TASK_URL:')) {
   iloveimgTaskUrl = status.replace('ILOVEIMG_TASK_URL:', '').trim();
   console.log(`[Progress Update] Captured ILoveIMG URL: ${iloveimgTaskUrl}`);
   return; // Don't show this internal message to user
  }
  
  progressUpdates.push(`> ${status}`);
  const recentUpdates = progressUpdates.slice(-10);
  try {
   await interaction.editReply({ 
    content: `🔄 **Converting to GIF**\n${recentUpdates.join('\n')}` 
   });
  } catch (e) {}
 };
 
 try {
  const options = {
   onProgress: updateProgress
  };
  
  const converter = new GIFConverter(url, options);
  const cdnUrl = await converter.convert();
  
  conversionComplete = true;
  clearTimeout(timeoutHandler);
  await interaction.editReply({
   content: `✅ **Converted to GIF**: ${cdnUrl}\n\n⚠️ **Note:** This file will expire from the CDN after 10 minutes. Please download it now!`
  });
 } catch (error) {
  console.error('GIF conversion error:', error);
  conversionComplete = true;
  clearTimeout(timeoutHandler);
  let errorMessage = error instanceof Error ? error.message : 'Unknown error';
  // Truncate error message if it's too long for Discord
  if (errorMessage.length > 1900) {
   errorMessage = errorMessage.substring(0, 1900) + '...';
  }
  await interaction.editReply({
   content: `❌ Failed to convert to GIF: ${errorMessage}`
  });
 }
};