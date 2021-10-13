import * as fs from 'fs';

const base = 'words/';

const ALL_WORDS = fs.readFileSync(`${base}all-words.txt`).toString().split('\r\n');

const COMMON_WORDS = fs.readFileSync(`${base}common-words.txt`).toString().split('\n');

const WORDNIK_WORDS = fs.readFileSync(`${base}wordnik-words.txt`).toString().split('\n');

export { ALL_WORDS, COMMON_WORDS, WORDNIK_WORDS };
