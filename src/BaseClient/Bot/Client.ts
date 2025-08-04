import * as DiscordCore from '@discordjs/core';
import * as Discord from 'discord.js';

const client = new Discord.Client({
 allowedMentions: {
  parse: ['users'],
  repliedUser: false,
 },
 partials: [],
 failIfNotExists: false,
 intents: [],
 sweepers: {
  messages: {
   interval: 60,
   lifetime: 1_209_600, // 14 days
  },
 },
 presence: {
  status: Discord.PresenceUpdateStatus.Idle,
  afk: true,
  activities: [
   {
    state: 'Starting up...',
    name: 'Starting up...',
    type: Discord.ActivityType.Custom,
   },
  ],
 },
});

await client.login(process.env.Token ?? '');

export const API = new DiscordCore.API(client.rest);
export default client;
