import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { getTempDirSync } from '../../getTempDir.js';
import Converter from './Converter.js';

export default abstract class YTConverter extends Converter {
 protected videoInfo: ytdl.videoInfo | null = null;

 constructor(url: string) {
  super(url);
 }

 protected async downloadYouTubeVideo(startTime?: number | null, endTime?: number | null, onProgress?: (status: string) => Promise<void>, skipAudio: boolean = false): Promise<string> {
  this.videoInfo = await ytdl.getInfo(this.url);
  
  // Sort formats by quality to get the absolute highest quality video
  // Include all video-only formats for maximum quality
  const videoFormats = this.videoInfo.formats
   .filter(f => f.hasVideo && !f.hasAudio)
   .sort((a, b) => {
    // Prioritize by height (resolution), then by bitrate
    const heightDiff = (b.height || 0) - (a.height || 0);
    if (heightDiff !== 0) return heightDiff;
    return (b.bitrate || 0) - (a.bitrate || 0);
   });

  // Log available formats for debugging
  console.log(`[YT Formats] Available video formats:`);
  videoFormats.slice(0, 5).forEach(f => {
   console.log(`  - ${f.qualityLabel || f.quality} (${f.width}x${f.height}), Codec: ${f.codecs}, Bitrate: ${f.bitrate}, Container: ${f.container}`);
  });

  // Get the highest quality video format
  const videoFormat = videoFormats[0];
  
  // Get highest quality audio (only if not skipping audio)
  const audioFormat = skipAudio ? null : ytdl.chooseFormat(this.videoInfo.formats, {
   quality: 'highestaudio',
   filter: 'audio',
  });

  if (!videoFormat) throw new Error('No suitable video format found');
  
  console.log(`[YT Format] Selected video format: ${videoFormat.qualityLabel || videoFormat.quality} (${videoFormat.width}x${videoFormat.height}) - Bitrate: ${videoFormat.bitrate}, Container: ${videoFormat.container}`);
  
  if (skipAudio) {
   console.log(`[YT Format] Skipping audio download for GIF conversion`);
  }
  
  if (onProgress) {
   const audioNote = skipAudio ? ' (no audio)' : '';
   await onProgress(`Selected format: ${videoFormat.qualityLabel || videoFormat.quality} (${videoFormat.width}x${videoFormat.height})${audioNote}`);
  }
  
  const videoId = this.videoInfo.videoDetails.videoId;
  const uniqueId = `${videoId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tempDir = getTempDirSync();
  const tempVideoPath = join(tempDir, `${uniqueId}_video.mp4`);
  const tempAudioPath = join(tempDir, `${uniqueId}_audio.mp4`);
  const finalPath = join(tempDir, `${uniqueId}.mp4`);

  // Download video stream
  const videoStream = ytdl(this.url, { format: videoFormat });
  const videoWriteStream = createWriteStream(tempVideoPath);
  await pipeline(videoStream, videoWriteStream);
  
  // Log video file size
  const videoStats = await fs.stat(tempVideoPath);
  const videoSizeMB = (videoStats.size / (1024 * 1024)).toFixed(2);
  console.log(`[YT Download] Video stream downloaded: ${videoSizeMB} MB (untrimmed)`);
  
  if (onProgress) {
   await onProgress(`Video downloaded: ${videoSizeMB} MB`);
  }

  // If we have audio and not skipping it, download and merge
  if (audioFormat && !skipAudio) {
   const audioStream = ytdl(this.url, { format: audioFormat });
   const audioWriteStream = createWriteStream(tempAudioPath);
   await pipeline(audioStream, audioWriteStream);
   
   // Log audio file size
   const audioStats = await fs.stat(tempAudioPath);
   const audioSizeMB = (audioStats.size / (1024 * 1024)).toFixed(2);
   console.log(`[YT Download] Audio stream downloaded: ${audioSizeMB} MB (untrimmed)`);

   if (onProgress) {
    await onProgress(`Merging video and audio${startTime !== null ? ', trimming...' : '...'}`);
   }
   
   // Merge video and audio (and trim if needed) using ffmpeg
   await new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg()
     .input(tempVideoPath)
     .input(tempAudioPath);
    
    // Apply trimming during merge if specified
    if (startTime !== null && startTime !== undefined) {
     cmd.setStartTime(startTime);
    }
    
    const duration = endTime !== null && endTime !== undefined && startTime !== null && startTime !== undefined 
     ? endTime - startTime 
     : undefined;
    
    if (duration !== undefined && duration !== null) {
     cmd.setDuration(duration);
    } else if (endTime !== null && endTime !== undefined) {
     cmd.outputOptions([`-to ${endTime}`]);
    }
    
    cmd
     .outputOptions(['-c:v copy', '-c:a aac', '-shortest'])
     .output(finalPath)
     .on('end', () => resolve())
     .on('error', (err) => reject(err))
     .run();
   });

   // Cleanup temp files
   await fs.unlink(tempVideoPath).catch(() => {});
   await fs.unlink(tempAudioPath).catch(() => {});
  } else {
   // No audio, handle trimming if needed
   if (startTime !== null || endTime !== null) {
    const duration = endTime !== null && endTime !== undefined && startTime !== null && startTime !== undefined 
     ? endTime - startTime 
     : undefined;
    
    await new Promise<void>((resolve, reject) => {
     const cmd = ffmpeg()
      .input(tempVideoPath);
     
     if (startTime !== null && startTime !== undefined) {
      cmd.setStartTime(startTime);
     }
     
     if (duration !== undefined && duration !== null) {
      cmd.setDuration(duration);
     } else if (endTime !== null && endTime !== undefined) {
      cmd.outputOptions([`-to ${endTime}`]);
     }
     
     cmd
      .outputOptions(['-c copy']) // Fast copy without re-encoding
      .output(finalPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
    });
    
    // Cleanup temp file
    await fs.unlink(tempVideoPath).catch(() => {});
   } else {
    // No trimming needed, just rename
    await fs.rename(tempVideoPath, finalPath);
   }
  }

  // Log file size
  const stats = await fs.stat(finalPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  const trimInfo = startTime !== null || endTime !== null 
   ? ` | Trimmed: ${startTime || 0} to ${endTime || 'end'}` 
   : '';
  console.log(`[YT Download] Video: ${videoId} | Size: ${fileSizeMB} MB | Quality: ${videoFormat.qualityLabel || videoFormat.quality}${trimInfo}`);

  return finalPath;
 }

 protected getYouTubeVideoId(): string | null {
  const match = this.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
 }

 abstract convert(): Promise<string>;
}