import { promises as fs } from 'fs';
import YTConverter from '../base/YTConverter.js';
import { uploadToSSH } from '../../sshUpload.js';

export default class YTtoMP4 extends YTConverter {
 constructor(url: string) {
  super(url);
 }

 async convert(): Promise<string> {
  const tempPath = await this.downloadYouTubeVideo();
  
  try {
   const videoId = this.getYouTubeVideoId();
   const fileName = videoId ? `${videoId}.mp4` : `video_${Date.now()}.mp4`;

   // Upload to SSH server and get CDN URL
   const cdnUrl = await uploadToSSH(tempPath, fileName);
   
   // Clean up temp file after successful upload
   await fs.unlink(tempPath).catch(() => {});
   
   return cdnUrl;
  } catch (error) {
   // Clean up temp file on error
   await fs.unlink(tempPath).catch(() => {});
   throw error;
  }
 }
}