import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default abstract class GIFConverterBase {
 protected readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
 protected readonly CLOSE_THRESHOLD = 55 * 1024 * 1024; // 55MB - if under this, try fine-tuning first

 async convertWithAdaptiveResolution(mp4Path: string): Promise<string> {
  const tempDir = join(tmpdir(), `gif_frames_${Date.now()}`);
  let outputGif = '';

  await fs.mkdir(tempDir, { recursive: true });

  try {
   // Start with high quality settings
   let maxWidth = 2000;
   let quality = 90;
   let fps = 30;

   while (maxWidth >= 240) {
    outputGif = join(tmpdir(), `output_${Date.now()}_${maxWidth}.gif`);

    // Clear previous frames
    const files = await fs.readdir(tempDir);
    await Promise.all(files.map((file) => fs.unlink(join(tempDir, file)).catch(() => {})));

    // Extract frames with current settings
    const scaleFilter = `scale='if(gt(iw,${maxWidth}),${maxWidth},-1)':'if(gt(iw,${maxWidth}),-1,ih)':flags=lanczos`;

    await execAsync(
     `ffmpeg -i "${mp4Path}" -vf "fps=${fps},${scaleFilter}" -q:v 1 "${tempDir}/frame%03d.png"`,
    );

    // Create GIF with current quality settings
    await execAsync(
     `gifski --fps ${fps} --quality ${quality} --motion-quality ${quality} --lossy-quality ${quality} --fast -o "${outputGif}" "${tempDir}"/frame*.png`,
    );

    // Check file size
    const stats = await fs.stat(outputGif);
    const fileSizeInMB = stats.size / (1024 * 1024);

    console.log(
     `Generated GIF: ${maxWidth}px width, ${quality}% quality, ${fps}fps: ${fileSizeInMB.toFixed(2)}MB`,
    );

    if (stats.size <= this.MAX_FILE_SIZE) {
     return outputGif;
    }

    // If we're close to the target (under 55MB), try fine-tuning first
    if (stats.size <= this.CLOSE_THRESHOLD) {
     await fs.unlink(outputGif).catch(() => {});

     // Calculate how much we need to reduce (aim for 48MB to have margin)
     const targetSize = 48 * 1024 * 1024;
     const reductionRatio = targetSize / stats.size;

     // Try adjusting quality first (less visible than resolution changes)
     if (quality > 70) {
      const newQuality = Math.max(70, Math.floor(quality * reductionRatio));
      console.log(`File close to limit, trying quality adjustment: ${newQuality}%`);

      outputGif = join(tmpdir(), `output_${Date.now()}_${maxWidth}_q${newQuality}.gif`);

      // Recreate with adjusted quality
      await execAsync(
       `gifski --fps ${fps} --quality ${newQuality} --motion-quality ${newQuality} --lossy-quality ${newQuality} --fast -o "${outputGif}" "${tempDir}"/frame*.png`,
      );

      const newStats = await fs.stat(outputGif);
      const newSizeInMB = newStats.size / (1024 * 1024);
      console.log(
       `Adjusted GIF: ${maxWidth}px width, ${newQuality}% quality: ${newSizeInMB.toFixed(2)}MB`,
      );

      if (newStats.size <= this.MAX_FILE_SIZE) {
       return outputGif;
      }
      await fs.unlink(outputGif).catch(() => {});
     }

     // If quality adjustment wasn't enough, try reducing fps
     if (fps > 20) {
      fps = 25;
      console.log(`Trying reduced framerate: ${fps}fps`);

      // Re-extract frames with lower fps
      const files2 = await fs.readdir(tempDir);
      await Promise.all(files2.map((file) => fs.unlink(join(tempDir, file)).catch(() => {})));

      await execAsync(
       `ffmpeg -i "${mp4Path}" -vf "fps=${fps},${scaleFilter}" -q:v 1 "${tempDir}/frame%03d.png"`,
      );

      outputGif = join(tmpdir(), `output_${Date.now()}_${maxWidth}_fps${fps}.gif`);

      await execAsync(
       `gifski --fps ${fps} --quality ${quality} --motion-quality ${quality} --lossy-quality ${quality} --fast -o "${outputGif}" "${tempDir}"/frame*.png`,
      );

      const fpsStats = await fs.stat(outputGif);
      const fpsSizeInMB = fpsStats.size / (1024 * 1024);
      console.log(`FPS adjusted GIF: ${maxWidth}px width, ${fps}fps: ${fpsSizeInMB.toFixed(2)}MB`);

      if (fpsStats.size <= this.MAX_FILE_SIZE) {
       return outputGif;
      }
      await fs.unlink(outputGif).catch(() => {});
     }
    }

    // File still too large, move to next resolution tier
    await fs.unlink(outputGif).catch(() => {});

    // Step down resolution
    if (maxWidth === 800) {
     maxWidth = 640;
     quality = 85;
    } else if (maxWidth === 640) {
     maxWidth = 480;
     quality = 80;
    } else if (maxWidth === 480) {
     maxWidth = 400; // Add intermediate step
     quality = 78;
    } else if (maxWidth === 400) {
     maxWidth = 320;
     quality = 75;
    } else if (maxWidth === 320) {
     maxWidth = 240;
     quality = 70;
     fps = 20; // Also reduce fps for smallest size
    } else {
     break;
    }
   }

   // Last resort: very small with low fps
   console.log('Using minimum settings as last resort');
   outputGif = join(tmpdir(), `output_${Date.now()}_final.gif`);

   const files = await fs.readdir(tempDir);
   await Promise.all(files.map((file) => fs.unlink(join(tempDir, file)).catch(() => {})));

   const finalScaleFilter = `scale='if(gt(iw,200),200,-1)':'if(gt(iw,200),-1,ih)':flags=lanczos`;

   await execAsync(
    `ffmpeg -i "${mp4Path}" -vf "fps=15,${finalScaleFilter}" -q:v 2 "${tempDir}/frame%03d.png"`,
   );

   await execAsync(
    `gifski --fps 15 --quality 60 --motion-quality 60 --lossy-quality 60 --fast -o "${outputGif}" "${tempDir}"/frame*.png`,
   );

   return outputGif;
  } finally {
   await fs.rm(tempDir, { recursive: true, force: true });
  }
 }
}
