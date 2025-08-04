import {
 ApplicationCommandType,
 ApplicationIntegrationType,
 ContextMenuCommandBuilder,
 InteractionContextType,
} from 'discord.js';

export default new ContextMenuCommandBuilder()
 .setName('Convert to MP4')
 .setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
 .setIntegrationTypes([ApplicationIntegrationType.UserInstall])
 .setType(ApplicationCommandType.Message);
