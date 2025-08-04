export enum VideoType {
 MP4 = 'mp4',
 YT = 'yt',
}

export default abstract class Converter {
 url: string;
 type: VideoType;

 constructor(url: string) {
  this.url = url;
  this.type = this.getVideoType();
 }

 public getVideoType(): VideoType {
  return this.url.includes('youtube.com') || this.url.includes('youtu.be')
   ? VideoType.YT
   : VideoType.MP4;
 }

 abstract convert(): Promise<string>;
}
