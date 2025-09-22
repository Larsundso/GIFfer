import Converter, { VideoType } from './base/Converter.js';
import YTtoGIF from './youtube/YTtoGIF.js';
import MP4toGIF from './mp4file/MP4toGIF.js';

export interface ConversionOptions {
 start?: number | null;
 end?: number | null;
 fps?: number;
 onProgress?: (status: string) => Promise<void>;
}

export default class GIFConverter extends Converter {
 private converter: YTtoGIF | MP4toGIF;

 constructor(url: string, options?: ConversionOptions) {
  super(url);
  this.converter = this.type === VideoType.YT ? new YTtoGIF(url, options) : new MP4toGIF(url, options);
 }

 async convert(): Promise<string> {
  return this.converter.convert();
 }
}