import MP4FileConverter from '../base/MP4FileConverter.js';
import { uploadBufferToSSH } from '../../sshUpload.js';

export default class MP4toMP4 extends MP4FileConverter {
 constructor(url: string) {
  super(url);
 }

 async convert(): Promise<string> {
  const buffer = await this.fetchMP4Buffer();
  const fileName = this.extractMP4FileName() || `video_${Date.now()}.mp4`;

  // Upload to SSH server and get CDN URL
  const cdnUrl = await uploadBufferToSSH(buffer, fileName);
  
  return cdnUrl;
 }
}