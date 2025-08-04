import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { getTempDirSync } from '../../getTempDir.js';

const execAsync = promisify(exec);

export default abstract class GIFConverterBase {
 async convertWithAdaptiveResolution(mp4Path: string): Promise<string> {
  const tempDirBase = getTempDirSync();
  const tempDir = join(tempDirBase, `gif_frames_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  let outputGif = '';

  await fs.mkdir(tempDir, { recursive: true });

  try {
   // Use maximum quality settings since we're not limited by file size
   const quality = 100;
   const fps = 60;

   outputGif = join(tempDirBase, `output_${Date.now()}_${Math.random().toString(36).substring(7)}.gif`);

   // Extract frames at original resolution with high quality
   await execAsync(
    `ffmpeg -i "${mp4Path}" -vf "fps=${fps}" -q:v 1 "${tempDir}/frame%03d.png"`,
   );

   // Create GIF with high quality settings
   await execAsync(
    `gifski --fps ${fps} --quality ${quality} --motion-quality ${quality} --lossy-quality ${quality} -o "${outputGif}" "${tempDir}"/frame*.png`,
   );

   // Log file size for monitoring
   const stats = await fs.stat(outputGif);
   const fileSizeInMB = stats.size / (1024 * 1024);

   console.log(
    `[GIF Converter] Generated GIF: Original resolution, ${quality}% quality, ${fps}fps: ${fileSizeInMB.toFixed(2)}MB`,
   );

   return outputGif;
  } finally {
   await fs.rm(tempDir, { recursive: true, force: true });
  }
 }
}
