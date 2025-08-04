/* eslint-disable no-console */
import * as DiscordCore from '@discordjs/core';
import * as DiscordRest from '@discordjs/rest';
import 'dotenv/config';
import commands from './SlashCommands/index.js';

const createCommands = Object.values(commands.public);
const token = process.env.Token ?? '';

const requestHandler = (t: string) =>
 new DiscordCore.API(new DiscordRest.REST({ version: '10' }).setToken(t.replace('Bot ', '')));

await requestHandler(token)
 .applicationCommands.bulkOverwriteGlobalCommands(
  Buffer.from(token.replace('Bot ', '')?.split('.')[0] ?? '0', 'base64').toString() ?? '',
  createCommands.map((c) => c.toJSON()),
 )
 .then((r) => console.log(`[MAIN] Registered ${r.length} Global Commands`));

setTimeout(async () => {
 console.log('Finished. Exiting...');

 process.exit(0);
}, 10000);
