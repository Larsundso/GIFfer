import { promises as fs } from 'fs';
import GIFConverterBase from '../base/GIFConverterBase.js';
import YTConverter from '../base/YTConverter.js';
import { uploadToSSH } from '../../sshUpload.js';

export default class YTtoGIF extends YTConverter {
 private gifConverter: GIFConverterBase;

 constructor(url: string) {
  super(url);
  this.gifConverter = new (class extends GIFConverterBase {})();
 }

 async convert(): Promise<string> {
  const mp4Path = await this.downloadYouTubeVideo();
  const tempGifPath = await this.gifConverter.convertWithAdaptiveResolution(mp4Path);

  const videoId = this.getYouTubeVideoId();
  const fileName = videoId ? `${videoId}.gif` : `output_${Date.now()}.gif`;
  
  // Upload to SSH server and get CDN URL
  const cdnUrl = await uploadToSSH(tempGifPath, fileName);
  
  await this.cleanup(mp4Path, tempGifPath);

  return cdnUrl;
 }

 private async cleanup(mp4Path: string, gifPath: string): Promise<void> {
  await Promise.all([fs.unlink(mp4Path).catch(() => {}), fs.unlink(gifPath).catch(() => {})]);
 }
}