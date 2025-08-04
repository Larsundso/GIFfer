import {
 ApplicationCommandType,
 ApplicationIntegrationType,
 ContextMenuCommandBuilder,
 InteractionContextType,
} from 'discord.js';

export default new ContextMenuCommandBuilder()
 .setName('Convert to eMP4')
 .setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
 .setIntegrationTypes([ApplicationIntegrationType.UserInstall])
 .setType(ApplicationCommandType.Message);