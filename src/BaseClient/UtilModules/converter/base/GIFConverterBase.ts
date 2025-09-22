import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { getTempDirSync } from '../../getTempDir.js';

const execAsync = promisify(exec);

export default abstract class GIFConverterBase {
 async convertWithAdaptiveResolution(mp4Path: string, customFps?: number, onProgress?: (status: string) => Promise<void>): Promise<string> {
  const tempDirBase = getTempDirSync();
  const tempDir = join(tempDirBase, `gif_frames_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  let outputGif = '';

  await fs.mkdir(tempDir, { recursive: true });

  try {
   // Use high quality settings for 4K content
   const quality = 100; // Maximum quality for 4K
   const fps = customFps || 15; // Default to 15fps for reasonable file size

   outputGif = join(tempDirBase, `output_${Date.now()}_${Math.random().toString(36).substring(7)}.gif`);

   // Get video dimensions to log
   const { stdout: videoInfo } = await execAsync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${mp4Path}"`
   );
   const resolution = videoInfo.trim();
   
   if (onProgress) {
    await onProgress(`Input video resolution: ${resolution}`);
   }

   // Extract frames at full resolution with maximum quality
   // Remove any scaling to preserve original 4K dimensions
   if (onProgress) {
    await onProgress(`Extracting frames at ${fps} FPS...`);
   }
   
   await execAsync(
    `ffmpeg -i "${mp4Path}" -vf "fps=${fps}" -q:v 1 -pix_fmt rgb24 "${tempDir}/frame%03d.png"`,
   );
   
   // Log first frame dimensions to verify extraction resolution
   const { stdout: frameInfo } = await execAsync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${tempDir}/frame001.png"`
   );
   console.log(`[GIF Converter] PNG frames extracted at: ${frameInfo.trim()}`);
   
   if (onProgress) {
    await onProgress(`Frames extracted at: ${frameInfo.trim()}`);
   }

   // Create GIF with maximum quality settings, force 4K width if input is 4K
   const width = parseInt(resolution.split('x')[0]);
   const gifskiWidthParam = width >= 3840 ? '--width 3840' : '';
   
   if (onProgress) {
    await onProgress('Creating GIF with gifski...');
   }
   
   await execAsync(
    `gifski --fps ${fps} --quality ${quality} --motion-quality ${quality} --lossy-quality ${quality} ${gifskiWidthParam} -o "${outputGif}" "${tempDir}"/frame*.png`,
   );

   // Get the actual GIF dimensions
   const { stdout: gifInfo } = await execAsync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${outputGif}"`
   );
   const gifResolution = gifInfo.trim();

   // Log file size for monitoring
   const stats = await fs.stat(outputGif);
   const fileSizeInMB = stats.size / (1024 * 1024);

   console.log(
    `[GIF Converter] Generated GIF: Input video ${resolution} -> Output GIF ${gifResolution}, ${quality}% quality, ${fps}fps: ${fileSizeInMB.toFixed(2)}MB`,
   );
   
   if (onProgress) {
    await onProgress(`GIF created: ${gifResolution}, ${fileSizeInMB.toFixed(2)}MB`);
   }

   return outputGif;
  } finally {
   await fs.rm(tempDir, { recursive: true, force: true });
  }
 }
}
