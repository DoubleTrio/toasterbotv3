import * as kanjis from "../kanji-jouyou.json";
import _ = require("lodash");

const camelize = (obj: Record<string, string>) => _.transform(obj, (acc: any, value, key, target) => {
	const camelKey = _.isArray(target) ? key : _.camelCase(key);
	
	acc[camelKey] = _.isObject(value) ? camelize(value) : value;
});
  
interface KanjiModel {
	[key : string] : KanjiInfoModel;
}

interface KanjiExample {
	kanji: string,
	hiragana: string,
	meaning: string,
}

interface KanjiInfoModel {
	strokes: number,
	grade: number,
	freq: number,
	jlptOld: number,
	jlptNew: number,
	meanings: string[],
	readingsOn: string[],
	readingsKun: string[],
	examplesOn: KanjiExample[],
	examplesKun: KanjiExample[],
	wkLevel: number,
	wkMeanings: string[],
	wkReadingsOn: string[],
	wkReadingsLun: string[],
	wkRadicals: string[],
	image: string,
}

class KanjiDB {
	public kanjis : KanjiModel;

	constructor(kanjis : any) {
		this.kanjis = camelize(kanjis as any);
	}	
	search(kanji : string) : KanjiInfoModel {
		return this.kanjis[kanji];
	} 
}
  
const kanjiDB = new KanjiDB(kanjis);

export { kanjiDB, KanjiInfoModel };
  