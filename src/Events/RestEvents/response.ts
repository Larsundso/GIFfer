import * as Discord from 'discord.js';
import { getDebugInfo } from '../../BaseClient/UtilModules/console.js';

export default async (request: Discord.APIRequest, response: Discord.ResponseLike) => {
 console.log(
  `${getDebugInfo()} [Request] ${request.method} ${request.path} - [Response] ${response.status} | ${response.statusText}\n`,
 );
};
