import { promises as fs } from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Configure your upload endpoint here
const UPLOAD_ENDPOINT = process.env.UPLOAD_ENDPOINT || 'https://cdn.ayakobot.com/upload';
const UPLOAD_SECRET = process.env.UPLOAD_SECRET || '';
const CDN_BASE_URL = 'https://cdn.ayakobot.com/converted';

export async function uploadToHTTP(localPath: string, fileName: string): Promise<string> {
 try {
  // Read file
  const fileBuffer = await fs.readFile(localPath);
  
  // Create form data
  const formData = new FormData();
  formData.append('file', fileBuffer, fileName);
  if (UPLOAD_SECRET) {
   formData.append('secret', UPLOAD_SECRET);
  }
  
  // Upload file
  console.log(`[HTTP Upload] Uploading ${fileName} to ${UPLOAD_ENDPOINT}...`);
  
  const response = await fetch(UPLOAD_ENDPOINT, {
   method: 'POST',
   body: formData as any,
   headers: formData.getHeaders(),
  });
  
  if (!response.ok) {
   throw new Error(`Upload failed with status ${response.status}: ${await response.text()}`);
  }
  
  // Log successful upload
  const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`[HTTP Upload] File: ${fileName} | Size: ${fileSizeMB} MB | Uploaded successfully`);
  
  // Return CDN URL
  const cdnUrl = `${CDN_BASE_URL}/${fileName}`;
  return cdnUrl;
  
 } catch (error) {
  console.error('HTTP Upload failed:', error);
  throw new Error(`Failed to upload file to CDN: ${error instanceof Error ? error.message : 'Unknown error'}`);
 }
}

export async function uploadBufferToHTTP(buffer: Buffer, fileName: string): Promise<string> {
 try {
  // Create form data
  const formData = new FormData();
  formData.append('file', buffer, fileName);
  if (UPLOAD_SECRET) {
   formData.append('secret', UPLOAD_SECRET);
  }
  
  // Upload file
  console.log(`[HTTP Upload] Uploading ${fileName} to ${UPLOAD_ENDPOINT}...`);
  
  const response = await fetch(UPLOAD_ENDPOINT, {
   method: 'POST',
   body: formData as any,
   headers: formData.getHeaders(),
  });
  
  if (!response.ok) {
   throw new Error(`Upload failed with status ${response.status}: ${await response.text()}`);
  }
  
  // Log successful upload
  const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
  console.log(`[HTTP Upload] File: ${fileName} | Size: ${fileSizeMB} MB | Uploaded successfully`);
  
  // Return CDN URL
  const cdnUrl = `${CDN_BASE_URL}/${fileName}`;
  return cdnUrl;
  
 } catch (error) {
  console.error('HTTP Upload failed:', error);
  throw new Error(`Failed to upload buffer to CDN: ${error instanceof Error ? error.message : 'Unknown error'}`);
 }
}