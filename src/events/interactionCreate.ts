import { APIMessage } from 'discord-api-types';
import {
  ClientEvents, CommandInteraction, Guild, Message, Permissions, TextChannel,
} from 'discord.js';
import i18n from 'i18next';
import { ToasterBot, ToasterBotEvent } from '../structures';

class InteractionCreateEvent extends ToasterBotEvent {
  constructor() {
    super({
      name: 'interactionCreate',
      once: false,
    });
  }

  async execute(client: ToasterBot, ...args: ClientEvents['interactionCreate']) : Promise<Message | APIMessage | void> {
    const interaction : CommandInteraction = args[0] as CommandInteraction;
    if (interaction.isCommand() && !interaction.user.bot) {
      await interaction.deferReply();
      const { commandName } = interaction;
      const command = client.commandHandler.getCommmand(commandName);

      if (command.ownerOnly && !client.isOwner(interaction.user.id)) {
        return interaction.followUp({
          content: i18n.t('ownerOnlyCommand'),
          ephemeral: true,
        });
      } if (command.guildOnly && !(interaction.guild instanceof Guild)) {
        return interaction.followUp({
          content: i18n.t('guildOnlyCommand'),
          ephemeral: true,
        });
      }

      if (interaction.channel instanceof TextChannel) {
        const userPermissions = command.memberPermissions;
        const clientPermissions = command.botPermissions;
        const missingPermissions = [];
        if (userPermissions?.length) {
          for (let i = 0; i < userPermissions.length; i += 1) {
            const memberPermissions = interaction.member.permissions as Readonly<Permissions>;
            const hasPermission = memberPermissions.has(userPermissions[i]);
            if (!hasPermission) {
              missingPermissions.push(userPermissions[i]);
            }
          }
          if (missingPermissions.length) {
            return interaction.followUp({
              content: i18n.t('memberMissingPermissions', { permissions: missingPermissions.join(', ') }),
              ephemeral: true,
            });
          }
        }
        if (clientPermissions?.length) {
          for (let i = 0; i < clientPermissions.length; i += 1) {
            const hasPermission = interaction.guild?.me?.permissions.has(clientPermissions[i]);
            if (!hasPermission) {
              missingPermissions.push(clientPermissions[i]);
            }
          }
          if (missingPermissions.length) {
            return interaction.followUp({
              content: i18n.t('botMissingPermissions', { permissions: missingPermissions.join(', ') }),
              ephemeral: true,
            });
          }
        }
      }

      if (!client.isOwner(interaction.user.id)) {
        const cooldownData = client.commandHandler.cooldownHandler.getCooldownData(command, interaction.user);
        if (cooldownData) {
          return interaction.followUp({
            content: i18n.t('commandOnCooldown', {
              timeLeft: cooldownData.timeLeft.toFixed(1),
              command,
            }),
            ephemeral: true,
          });
        }
      }
      try {
        command.runInteraction(interaction);
      } catch (error) {
        return interaction.followUp({
          content: i18n.t('commandOnError'),
          ephemeral: true,
        });
      }
    }
  }
}

export default InteractionCreateEvent;
