import convert from './Commands/convert.js';
import convertMp4 from './Commands/convert-mp4.js';
import convertGif from './Commands/convert-gif.js';

export default {
 public: {
  convert,
  convertMp4,
  convertGif,
 },
} as const;
