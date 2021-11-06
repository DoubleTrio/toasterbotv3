import { APIMessage } from 'discord-api-types';
import {
  CommandInteraction,
  EmbedFieldData,
  Message,
	MessageEmbedOptions,
} from 'discord.js';
import { codeBlockList, ordinal } from '../../helpers';
import { kanjiDB } from '../../kanji';
import {
  Command, CommandInfo, ToasterBot,
} from '../../structures';

class KanjiSearchCommand extends Command {
  constructor(client: ToasterBot, info: CommandInfo) {
    super(client, info, {
      name: 'search',
      enabled: true,
      guildOnly: true,
      cooldown: 2 * 1000,
      options: [
        {
          name: 'kanji',
          type: 'STRING',
          required: true,
          description: 'The kanji to search for',
        },
      ],
    });
  }

  async runInteraction(interaction: CommandInteraction) : Promise<Message | APIMessage | void> {
		const input = interaction.options.getString('kanji').trim();
		
		const kanji = kanjiDB.search(input);

		if (!kanji) {
			return interaction.followUp({
				content: 'Kanji input not found',
			});
		}

		const fields : EmbedFieldData[] = [
			{
				name: '**Total Strokes**',
				value: kanji.strokes.toString() + ' stroke' + (kanji.strokes === 1 ? '' : 's'),
				inline: true,
			},
			{
				name: '**Grade Level**',
				value: ordinal(kanji.grade),
				inline: true,
			},
			{
				name: '**Frequency**',
				value: ordinal(kanji.freq),
				inline: true,
			},
			{
				name: '**JPLT Level (New)**',
				value: kanji.jlptNew.toString(),
			},
			{
				name: '**Meanings**',
				value: codeBlockList(kanji.meanings),
			},
			{
				name: '**On\'yomi Readings (Chinese)**',
				value: codeBlockList(kanji.readingsOn),
			},
			{
				name: '**Kun\'yomi Readings (Japanese)**',
				value: codeBlockList(kanji.readingsKun),
			}
		];
		
		if (kanji.examplesOn) {
			const examples = kanji.examplesOn;
			fields.push({
				name: '**On\'yomi Example**',
				value: examples.map(({ kanji, hiragana, meaning }) => {
					return `${kanji} \`(${hiragana})\` ${meaning}`;
				}).join('\n\n')
			})
		}

		if (kanji.examplesKun) {
			const examples = kanji.examplesKun;
			fields.push({
				name: '**Kun\'yomi Example**',
				value: examples.map(({ kanji, hiragana, meaning }) => {
					return `${kanji} \`(${hiragana})\` ${meaning}`;
				}).join('\n\n')
			})
		}

		let embed : MessageEmbedOptions = {
			title: input,
			color: this.client.colors.primary,
			fields,
		}

		if (kanji.image) {
			embed = {
				...embed,
				image: {
					url: kanji.image,
				}
			}
		}
		
		return interaction.followUp({
			embeds: [embed],
		});
  }
}

export default KanjiSearchCommand;
