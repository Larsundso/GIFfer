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
   )
   .addStringOption((o) =>
    o.setName('start').setDescription('Start time (e.g., 1:30 or 90 for seconds)').setRequired(false),
   )
   .addStringOption((o) =>
    o.setName('end').setDescription('End time (e.g., 2:00 or 120 for seconds)').setRequired(false),
   )
   .addIntegerOption((o) =>
    o.setName('fps').setDescription('Frames per second (default: 15)').setRequired(false).setMinValue(1).setMaxValue(60),
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
