import { Message } from 'discord.js';

function addReactions(m: Message, reactionsList: string[]) : Promise<unknown> {
  return Promise.all(reactionsList.map((reaction) => m.react(reaction)));
}

export default addReactions;
