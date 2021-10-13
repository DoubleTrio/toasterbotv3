import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  CommandInteractionOption,
  EmbedField,
  Message,
  MessageActionRow,
  MessageEmbedOptions,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from 'discord.js';
import i18n from 'i18next';
import * as _ from 'lodash';
import { Command, CommandInfo, ToasterBot } from '../../structures';
import { PaginatedEmbed } from '../../utils';

class Help extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(
      client,
      info, {
        name: 'help',
        aliases: ['commands'],
        options: [
          {
            type: 'STRING',
            name: 'command',
            description: 'A command name to get more information about',
            required: false,
          },
        ],
      },
    );
  }

  async runInteraction(interaction: CommandInteraction): Promise<void | Message | APIMessage> {
    const args = interaction.options.data;
    const hasCommand = args.length;
    if (!hasCommand) {
      return this.getAllCommands(interaction);
    }

    return this.getCommand(interaction, args[0]);
  }

  private getAllCommands(interaction: CommandInteraction) : Promise<void> {
    const uniqueGroups = _.uniq(
      this.client.commandHandler.commands.map((command) => command.group),
    );
    const allOption: MessageSelectOptionData = {
      label: 'All',
      value: 'all',
      description: i18n.t('help.seeAllCommands'),
    };

    const groupOptions: MessageSelectOptionData[] = uniqueGroups.map((group: string) => ({
      label: this.client.capitalize(group),
      value: group,
      description: i18n.t('help.categoryOptionDescription', {
        group,
      }),
    }));

    const allGroupOptions = [allOption, ...groupOptions];

    const components = (state: boolean) => new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('help-menu')
        .setPlaceholder(i18n.t('help.categoryPlaceholder'))
        .setDisabled(state)
        .addOptions(allGroupOptions),
    );

    const filter = (currentInteraction: SelectMenuInteraction) => currentInteraction.user.id
      === interaction.user.id;

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      componentType: 'SELECT_MENU',
      time: 30000,
    });

    const paginatedEmbed = new PaginatedEmbed<Command>(interaction, {
      embedData: {
        fields: [
          {
            name: `**${i18n.t('help.infoName')}**`,
            value: i18n.t('help.infoValue', {
              required: '<>',
              optional: '[]',
            }),
          },
        ],
        title: `**${i18n.t('help.commandTitle')}**`,
        color: this.client.colors.primary,
        thumbnail: {
          url: this.client.user.avatarURL(),
        },
      },
      perPage: 10,
      items: [...this.client.commandHandler.commands.values()],
      transform: (command: Command) => ({
        name: `**/${command.name} ${this.formatOptions(command).join(', ')}**`,
        value: command.description,
      }),
      components: [components(false)],
    });

    collector.on('collect', (menuInteraction: SelectMenuInteraction) => {
      collector.resetTimer();
      const [group] = menuInteraction.values;
      let cmds;

      if (group !== 'all') {
        cmds = this.client.commandHandler.commands.filter(
          (command: Command) => command.group === group,
        );
      } else {
        cmds = this.client.commandHandler.commands;
      }

      paginatedEmbed.update(menuInteraction, [...cmds.values()]);
    });

    return paginatedEmbed.create();
  }

  private getCommand(interaction: CommandInteraction, option: CommandInteractionOption)
    : Promise<Message | APIMessage> {
    const input = option.value as string;
    const command = this.client.commandHandler.getCommmand(input);
    if (command) {
      const descriptionField : EmbedField = {
        name: `**${i18n.t('help.descriptionName')}**`,
        value: command.extendedDescription,
        inline: false,
      };

      const aliasesField : EmbedField = {
        name: `**${i18n.t('help.aliasesName')}**`,
        value: command.aliases.map((alias) => `\`\`${alias}\`\``)
          .join(' ') || 'NA',
        inline: false,
      };

      const userPermissionsField : EmbedField = {
        name: `**${i18n.t('help.userPermissionsRequiredName')}**`,
        value: `${
          command.memberPermissions
            .map((perm) => `\`\`${perm}\`\``)
            .join('-') || 'NA'
        }`,
        inline: false,
      };

      const botPermissionsField : EmbedField = {
        name: `**${i18n.t('help.clientPermissionsRequiredName')}**`,
        value: `${
          command.botPermissions
            .map((perm) => `\`\`${perm}\`\``)
            .join('-') || 'NA'
        }`,
        inline: false,
      };

      const fields: EmbedField[] = [
        descriptionField,
        aliasesField,
        userPermissionsField,
        botPermissionsField,
      ];

      const embed : MessageEmbedOptions = {
        color: this.client.colors.primary,
        title: `${command.name} ${this.formatOptions(command).join(', ')} ${command.nsfw ? '(NSFW)' : ''}`,
        footer: {
          text: `${command.guildOnly ? `**${i18n.t('help.guildOnlyCommandFooter')}**` : '\n'}`,
        },
        fields,
      };

      return interaction.followUp({ embeds: [embed] });
    }

    return interaction.followUp({
      content: i18n.t('help.noCommandFound'),
      ephemeral: true,
    });
  }

  private formatOptions(command: Command) : string[] {
    const formattedOptionsList: string[] = [];
    command.options.forEach((arg) => {
      let option : string;
      if (arg.required) {
        option = `\`<${arg.name}>\``;
      } else {
        option = `\`[${arg.name}]\``;
      }
      formattedOptionsList.push(option);
    });
    return formattedOptionsList;
  }
}

export default Help;
