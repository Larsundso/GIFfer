import { getDebugInfo } from '../../BaseClient/UtilModules/console.js';

export default async (info: string) => {
 console.log(`${getDebugInfo()} [Rest Debug] ${info}\n`);
};
