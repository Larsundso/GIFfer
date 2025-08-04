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

// Ensure login only happens once
let loginPromise: Promise<string> | null = null;

export const login = async () => {
 if (!loginPromise) {
  loginPromise = client.login(process.env.Token ?? '');
 }
 return loginPromise;
};

// Initialize login
await login();

export const API = new DiscordCore.API(client.rest);
export default client;
