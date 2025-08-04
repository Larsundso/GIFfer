/* eslint-disable no-console */
import 'dotenv/config';
import * as Jobs from 'node-schedule';
import sms from 'source-map-support';
import './BaseClient/Bot/Events.js';
import './BaseClient/UtilModules/console.js';
import getPathFromError from './BaseClient/UtilModules/getPathFromError.js';

console.clear();
console.log('++++++++++++++ Welcome to GIFfer ++++++++++++++++');
console.log('+      Restart all Clusters with "restart"      +');
console.log('+                  Arguments:                   +');
console.log('+   --debug --debug-db --warn --debug-queries   +');
console.log('+                --silent --dev                 +');
console.log('+++++++++++++++++++++++++++++++++++++++++++++++++');

sms.install({
 handleUncaughtExceptions: process.argv.includes('--debug'),
 environment: 'node',
 emptyCacheBetweenOperations: process.argv.includes('--debug'),
});

Jobs.scheduleJob(getPathFromError(new Error()), '*/10 * * * *', async () => {
 console.log(`=> Current Date: ${new Date().toLocaleString()}`);
});

if (process.argv.includes('--debug')) console.log('[DEBUG] Debug mode enabled');
if (process.argv.includes('--debug-db')) console.log('[DEBUG] Debug mode for database enabled');
if (process.argv.includes('--warn')) console.log('[DEBUG] Warn mode enabled');
if (process.argv.includes('--silent')) console.log('[DEBUG] Silent mode enabled');
