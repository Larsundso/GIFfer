import {
 ApplicationIntegrationType,
 InteractionContextType,
 SlashCommandBuilder,
} from 'discord.js';

export default new SlashCommandBuilder()
 .setName('convert')
 .setDescription('Convert something')
 .setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
 .setIntegrationTypes([ApplicationIntegrationType.UserInstall])
 .addSubcommand((s) =>
  s
   .setName('to-gif')
   .setDescription('Convert a video to GIF')
   .addStringOption((o) =>
    o.setName('url').setDescription('The URL of the video to convert').setRequired(true),
   ),
 )
 .addSubcommand((s) =>
  s
   .setName('to-mp4')
   .setDescription('Convert a video to MP4')
   .addStringOption((o) =>
    o.setName('url').setDescription('The URL of the video to convert').setRequired(true),
   ),
 );
