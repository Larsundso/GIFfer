import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getTempDirSync } from './getTempDir.js';

// Create exec with proper shell
const execAsync = (cmd: string) => {
 return promisify(exec)(cmd, {
  shell: '/bin/sh',
  env: { ...process.env, SHELL: '/bin/sh' },
 });
};

const { SSH_HOST, SSH_USER, REMOTE_PATH, CDN_BASE_URL } = process.env;

export async function uploadToSSH(localPath: string, fileName: string): Promise<string> {
 try {
  // Ensure local file exists
  await fs.access(localPath);

  // Determine SSH paths based on environment
  const homeDir = process.env.HOME || '/home/nodejs';
  const isDocker = await fs.access('/.dockerenv').then(() => true).catch(() => false);
  
  const sshConfigPath = isDocker ? '/home/nodejs/.ssh/config' : `${homeDir}/.ssh/config.giffer`;
  const keyPath = isDocker ? '/home/nodejs/.ssh/docker_hetzner_rsa' : `${homeDir}/.ssh/keys/docker_hetzner_rsa`;
  
  let scpCommand: string;

  try {
   await fs.access(sshConfigPath);
   // Use config file if it exists
   const remotePath = `${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/${fileName}`;
   scpCommand = `scp -F ${sshConfigPath} "${localPath}" "${remotePath}"`;
  } catch {
   // Fallback: Use direct command with cloudflared
   console.log('[SSH Upload] Config not found, using direct cloudflared command');
   const remotePath = `${REMOTE_PATH}/${fileName}`;
   
   // Check if key exists
   try {
    await fs.access(keyPath);
   } catch {
    throw new Error(`SSH key not found at ${keyPath}`);
   }
   
   // Use correct cloudflared path based on environment
   const cloudflarePath = isDocker ? '/usr/local/bin/cloudflared' : '/usr/bin/cloudflared';
   scpCommand = `scp -o "ProxyCommand=${cloudflarePath} access ssh --hostname ${SSH_HOST}" -o "StrictHostKeyChecking=no" -i ${keyPath} "${localPath}" "${SSH_USER}@${SSH_HOST}:${remotePath}"`;
  }

  // Execute SCP command
  console.log(`[SSH Upload] Uploading ${fileName}...`);
  console.log(`[SSH Upload] Command: ${scpCommand}`);

  try {
   const { stderr } = await execAsync(scpCommand);

   // Some warnings are OK, but actual errors are not
   if (stderr && !stderr.toLowerCase().includes('warning') && stderr.trim() !== '') {
    console.error(`[SSH Upload] stderr: ${stderr}`);
   }
  } catch (execError: any) {
   console.error(`[SSH Upload] Failed with exit code ${execError.code}`);
   console.error(`[SSH Upload] stderr: ${execError.stderr}`);
   console.error(`[SSH Upload] stdout: ${execError.stdout}`);
   throw new Error(`SCP failed: ${execError.stderr || execError.message}`);
  }

  // Log successful upload
  const stats = await fs.stat(localPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(
   `[SSH Upload] File: ${fileName} | Size: ${fileSizeMB} MB | Uploaded to: ${REMOTE_PATH}/${fileName}`,
  );

  // Return CDN URL
  const cdnUrl = `${CDN_BASE_URL}/${fileName}`;
  return cdnUrl;
 } catch (error) {
  console.error('SSH Upload failed:', error);
  throw new Error(
   `Failed to upload file to CDN: ${error instanceof Error ? error.message : 'Unknown error'}`,
  );
 }
}

export async function uploadBufferToSSH(buffer: Buffer, fileName: string): Promise<string> {
 try {
  // Create a temporary file
  const tempDir = getTempDirSync();
  const tempPath = `${tempDir}/${fileName}`;
  await fs.writeFile(tempPath, buffer);

  // Upload using the existing function
  const cdnUrl = await uploadToSSH(tempPath, fileName);

  // Clean up temp file
  await fs.unlink(tempPath).catch(() => {});

  return cdnUrl;
 } catch (error) {
  console.error('SSH Buffer Upload failed:', error);
  throw new Error(
   `Failed to upload buffer to CDN: ${error instanceof Error ? error.message : 'Unknown error'}`,
  );
 }
}
