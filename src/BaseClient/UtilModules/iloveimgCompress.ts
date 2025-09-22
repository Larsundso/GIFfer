import fetch from 'node-fetch';
import FormData from 'form-data';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';

interface ILoveImgStartResponse {
  server: string;
  task: string;
  remaining_credits?: number;
}

interface ILoveImgUploadResponse {
  server_filename: string;
}

interface ILoveImgProcessResponse {
  download_filename: string;
  filesize: number;
  output_filesize: number;
  output_filenumber: number;
  output_extensions: string;
  timer: string;
  status: string;
}

class ILoveImgCompressor {
  private apiKey: string;
  private apiSecret: string;
  private bearerToken?: string;
  private tokenExpiry?: number;

  constructor() {
    // Get credentials from environment variables
    this.apiKey = process.env.ILOVEIMG_API_KEY || '';
    this.apiSecret = process.env.ILOVEIMG_API_SECRET || '';
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('[ILoveImg] API credentials not configured. GIF compression will be skipped.');
    }
  }

  private async authenticate(): Promise<void> {
    // Check if we have a valid token
    if (this.bearerToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return;
    }

    const response = await fetch('https://api.ilovepdf.com/v1/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_key: this.apiKey,
        secret_key: this.apiSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json() as { token: string };
    this.bearerToken = data.token;
    // Token expires in 2 hours, refresh after 1.5 hours
    this.tokenExpiry = Date.now() + (90 * 60 * 1000);
  }

  async compressGif(
    inputPath: string,
    outputPath: string,
    onProgress?: (status: string) => Promise<void>
  ): Promise<string> {
    // Skip if credentials not configured
    if (!this.apiKey || !this.apiSecret) {
      console.log('[ILoveImg] Skipping compression - no API credentials');
      return inputPath;
    }

    try {
      // Step 1: Authenticate
      await this.authenticate();
      
      if (onProgress) await onProgress('Starting image compression...');

      // Step 2: Start task and get server
      const startResponse = await fetch('https://api.ilovepdf.com/v1/start/compressimage/eu', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      });

      if (!startResponse.ok) {
        throw new Error(`Failed to start task: ${startResponse.statusText}`);
      }

      const startData = await startResponse.json() as ILoveImgStartResponse;
      const { server, task } = startData;
      
      if (onProgress) await onProgress('Uploading GIF for compression...');

      // Step 3: Upload file
      const formData = new FormData();
      formData.append('task', task);
      formData.append('file', createReadStream(inputPath));

      const uploadResponse = await fetch(`https://${server}/v1/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json() as ILoveImgUploadResponse;
      
      if (onProgress) await onProgress('Compressing GIF...');

      // Step 4: Process file with recommended compression
      const processResponse = await fetch(`https://${server}/v1/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task,
          tool: 'compressimage',
          files: [{
            server_filename: uploadData.server_filename,
            filename: 'input.gif',
          }],
          compression_level: 'low',
        }),
      });

      if (!processResponse.ok) {
        throw new Error(`Failed to process file: ${processResponse.statusText}`);
      }

      const processData = await processResponse.json() as ILoveImgProcessResponse;
      
      if (processData.status !== 'TaskSuccess') {
        throw new Error(`Task failed: ${processData.status}`);
      }

      // Log compression results
      const originalSize = (processData.filesize / (1024 * 1024)).toFixed(2);
      const compressedSize = (processData.output_filesize / (1024 * 1024)).toFixed(2);
      const reduction = ((1 - processData.output_filesize / processData.filesize) * 100).toFixed(1);
      
      console.log(`[ILoveImg] Compressed: ${originalSize}MB → ${compressedSize}MB (${reduction}% reduction)`);
      if (onProgress) await onProgress(`Compressed: ${originalSize}MB → ${compressedSize}MB`);

      // Step 5: Download compressed file
      if (onProgress) await onProgress('Downloading compressed GIF...');
      
      const downloadResponse = await fetch(`https://${server}/v1/download/${task}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      });

      if (!downloadResponse.ok) {
        throw new Error(`Failed to download file: ${downloadResponse.statusText}`);
      }

      // Save compressed file
      const buffer = Buffer.from(await downloadResponse.arrayBuffer());
      await fs.writeFile(outputPath, buffer);

      return outputPath;
    } catch (error) {
      console.error('[ILoveImg] Compression failed:', error);
      if (onProgress) await onProgress('Compression failed, using original file');
      
      // Return original file if compression fails
      return inputPath;
    }
  }
}

// Export singleton instance
const compressor = new ILoveImgCompressor();

export async function compressGifWithILoveImg(
  inputPath: string, 
  outputPath: string,
  onProgress?: (status: string) => Promise<void>
): Promise<string> {
  return compressor.compressGif(inputPath, outputPath, onProgress);
}