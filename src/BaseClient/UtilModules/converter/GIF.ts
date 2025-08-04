import Converter, { VideoType } from './base/Converter.js';
import YTtoGIF from './youtube/YTtoGIF.js';
import MP4toGIF from './mp4file/MP4toGIF.js';

export default class GIFConverter extends Converter {
 private converter: YTtoGIF | MP4toGIF;

 constructor(url: string) {
  super(url);
  this.converter = this.type === VideoType.YT ? new YTtoGIF(url) : new MP4toGIF(url);
 }

 async convert(): Promise<string> {
  return this.converter.convert();
 }
}