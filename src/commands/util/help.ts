import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
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
import { Command, CommandInfo, ToasterBot, GroupCommand } from '../../structures';
import { PaginatedEmbed } from '../../utils';

class HelpCommand extends Command {
  private allCommands : Command[] = [];

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
    if (!this.allCommands.length) {
      for (const command of this.client.commandHandler.commands.values()) {
        if (command instanceof GroupCommand) {
          command.commands.forEach((subCommand) => {
            this.allCommands.push(subCommand);
          });
        } else {
          this.allCommands.push(command);
        }
      }
    }

    const command = interaction.options.getString('command');
    if (!command) {
      return this.getAllCommands(interaction);
    }

    return this.getCommand(interaction, command);
  }

  private getAllCommands(interaction: CommandInteraction) : Promise<void> {
    const all = 'all';
    const allOption: MessageSelectOptionData = {
      label: i18n.t('help.groupAll'),
      value: all,
      description: i18n.t(`group.${all}`),
    };

    const misc = 'misc';
    const miscOption: MessageSelectOptionData = {
      label: i18n.t('help.groupMisc'),
      value: misc,
      description: i18n.t(`group.${misc}`),
    };

    const groupOptions: MessageSelectOptionData[] = this.client.commandHandler.commands.filter((cmd) => cmd.group !== 'misc')
      .map((cmd: Command) => ({
        label: this.client.capitalize(cmd.group),
        value: cmd.group,
        description: cmd.description,
      }));

    const allGroupOptions = [allOption, ...groupOptions, miscOption];

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
      time: 30 * 1000,
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
      items: [...this.allCommands.values()],
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
        cmds = this.allCommands.filter(
          (command: Command) => command.group === group,
        );
      } else {
        cmds = this.allCommands;
      }

      paginatedEmbed.update(menuInteraction, [...cmds.values()]);
    });

    return paginatedEmbed.create();
  }

  private getCommand(interaction: CommandInteraction, commandName: string)
    : Promise<Message | APIMessage> {
    const command = this.allCommands.find((cmd) => cmd.name === commandName);
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

      return interaction.editReply({ embeds: [embed] });
    }

    return interaction.editReply({
      content: i18n.t('help.noCommandFound'),
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

export default HelpCommand;
