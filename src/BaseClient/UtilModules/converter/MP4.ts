import Converter, { VideoType } from './base/Converter.js';
import YTtoMP4 from './youtube/YTtoMP4.js';
import MP4toMP4 from './mp4file/MP4toMP4.js';

export default class MP4Converter extends Converter {
 private converter: YTtoMP4 | MP4toMP4;

 constructor(url: string) {
  super(url);
  this.converter = this.type === VideoType.YT ? new YTtoMP4(url) : new MP4toMP4(url);
 }

 async convert(): Promise<string> {
  return this.converter.convert();
 }
}