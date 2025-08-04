import convert from './Commands/convert.js';
import convertMp4 from './Commands/convert-mp4.js';
import convertGif from './Commands/convert-gif.js';
import convertEmp4 from './Commands/convert-emp4.js';

export default {
 public: {
  convert,
  convertMp4,
  convertGif,
  convertEmp4,
 },
} as const;
