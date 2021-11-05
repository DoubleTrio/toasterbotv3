import i18next from 'i18next/index';
import {
  commands, game, general, group,
} from '../../i18n/en';

import { ToasterBot } from '..';

function unescapeHTML(escapedHTML: string) {
  return escapedHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

class InternalizationHandler {
  async init(client: ToasterBot) : Promise<void> {
    await i18next.init({
      lng: 'en',
      debug: client.debug,
      interpolation: {
        format(value, format) {
          const unescapedValue = unescapeHTML(value);
          if (format === 'codeBlock') return `\`\`${unescapedValue}\`\``;
          if (format === 'bold') return `**${unescapedValue}**`;
          return unescapedValue;
        },
      },
      resources: {
        en: {
          translation: {
            ...commands,
            ...general,
            ...game,
            ...group,
          },
        },
      },
    });
  }
}

export default InternalizationHandler;
