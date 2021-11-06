import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  Message,
} from 'discord.js';
import { codeBlockList, generateIntegerChoices, ordinal } from '../../helpers';
import { kanjiDB } from '../../kanji';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';
import { PaginatedEmbed } from '../../utils';

interface KanjiPreview {
	kanji: string,
	firstOn: string,
	meanings: string[],
	grade: number,
}

const kanjiInfo : KanjiPreview[] = [];

for (const [kanji, info] of Object.entries(kanjiDB.kanjis)) {
	kanjiInfo.push({
		kanji,
		firstOn: info.readingsOn[0],
		grade: info.grade,
		meanings: info.meanings,
	})
}

class KanjiAllCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'all',
      enabled: true,
      guildOnly: true,
      cooldown: 2 * 1000,
      options: [
        {
          name: 'per',
          type: 'INTEGER',
          required: false,
          description: 'The amount of kanjis displayed per page (default 10)',
					choices: generateIntegerChoices(20),
        },
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
		const perPage = interaction.options.getInteger('per') || 10;

		const paginatedEmbed = new PaginatedEmbed<KanjiPreview>(
			interaction, {
				embedData: {
					color: this.client.colors.primary,
				},
				items: kanjiInfo,
				perPage,
				transform: (preview : KanjiPreview) => {
					return {
						name: `${preview.kanji} (${preview.firstOn}) - ${ordinal(preview.grade)} grade`,
						value: codeBlockList(preview.meanings)
					} 
				}
			}
		)
		return paginatedEmbed.create();
  }
}

export default KanjiAllCommand;

