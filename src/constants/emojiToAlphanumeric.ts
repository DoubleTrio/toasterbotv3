interface Hash {
  [key: string]: string | number;
}

const EMOJI_TO_ALPHANUMERIC : Hash = {
  '🇦': 'a',
  '🇧': 'b',
  '🇨': 'c',
  '🇩': 'd',
  '🇪': 'e',
  '🇫': 'f',
  '🇬': 'g',
  '🇭': 'h',
  '🇮': 'i',
  '🇯': 'j',
  '🇰': 'k',
  '🇱': 'l',
  '🇲': 'm',
  '🇳': 'n',
  '🇴': 'o',
  '🇵': 'p',
  '🇶': 'q',
  '🇷': 'r',
  '🇸': 's',
  '🇹': 't',
  '🇺': 'u',
  '🇻': 'v',
  '🇼': 'w',
  '🇽': 'x',
  '🇾': 'y',
  '🇿': 'z',
  '0⃣': 0,
  '1⃣': 1,
  '2⃣': 2,
  '3⃣': 3,
  '4⃣': 4,
  '5⃣': 5,
  '6⃣': 6,
  '7⃣': 7,
  '8⃣': 8,
  '9⃣': 9,
  '🔁': 'AGAIN',
  '✅': 'YES',
  '🟨': 'BLANK',
} as const;

type EmojiKey = keyof typeof EMOJI_TO_ALPHANUMERIC;

export { EmojiKey, EMOJI_TO_ALPHANUMERIC };
