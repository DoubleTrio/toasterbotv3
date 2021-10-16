import { stripIndent } from 'common-tags';

export default {
  blackjack: {
    name: 'Blackjack',
    description: 'Cure your gambling addiction in a classic game of blackjack',
    extendedDescription: stripIndent`
      Play the classic game of $t(blackjack.name)! First place bets, then get closer to 21 than the dealer!

      **Betting**
      -In the betting phase, type in an integer amount that you want to bet (eg: 100, 30, 7)
      -The bet must be a minimum of $5 
      -The bet must not exceed your total amount of money

      **Playing**
      -Click on one of the following buttons below to choose your action. 
      -\`Hit\` - Adds a random card from the deck into your hand
      -\`Stand\` - Ends your turn and the dealers play
      -\`Double Down\` - Double your initial bet (if possible) and add **only** one card into your hand
      -\`End Game\` - Ends the current game of $t(blackjack.name)
      
      **Ending**
      -The game ends once all rounds are finished or the player can no longer bet

      **Other**
      -The dealer always stays at 16
    `,
    betTooLow: 'Your bet is too **low**, try again **(>= {{min}})**',
    betTooHigh: 'Your bet is too **high**, try again **(<= {{max}})**',
    btnEndGame: 'End Game',
    btnHit: 'Hit', 
    btnStand: 'Stand',
    btnDoubleDown: 'Double Down',
    canNoLongerBet: 'You can longer bet... You walk away with $t(blackjack.money, { "amount": {{amount}} })',
    dealerHand: 'Dealer Hand',
    money: '**${{amount}}**',
    onDealerBlackjackWin: 'Ouch, although you and the dealer tied, you **lost** because they had a **$t(blackjack.name)**',
    onDealerBust: '**You won!** The dealer busted!',
    onDealerWin: 'Ouch, the dealer had a better hand than you', 
    onPlayerWin: '**Nicely done!** You won against the dealer this round!',
    onPlayerBlackjackWin: 'Although you and the dealer tied, you **won** because you had a **$t(blackjack.name)**',
    onDraw: 'You and the dealer **tied!**',
    onEndGame: 'You have quitted **$t(blackjack.name)**!',
    onPlayerHitBust: 'Ouch, you have busted...',
    placeBets: 'Type in how much you want to bet! You have $t(blackjack.money, { "amount": {{amount}} }) left!',
    playerHand: 'Player Hand',
    totalMoney: 'Total Money',
    winMessage: 'Congrats! You won $t(blackjack.money, { "amount": {{amount}} })!',
    yourBet: 'Your Bet',
  },
  connect4: {
    name: 'Connect4',
    description: 'Challenge someone in the classic game of Connect4',
    extendedDescription: stripIndent`
      Take turns dropping tokens between you and your opponent and "connect" 4 in the row vertically, horizontally, or diagonally to win!
          
      **Dropping Tiles**
      -Reactions will appear below the Connect4 embed, representing the column your token will be dropped into
      -Click on one of the reactions to drop your tile into the column
      
      **Ending**
      -The game will end when you or the opponent "connects" 4 in a row or when all the columns are filled
		`,

    turnMessage: '{{token}} It\'s your turn, **{{player.nickname}}**',
    winMessage: '{{token}} **{{player.nickname}}** has won $t(connect4.name)',
  },
  duel: {
    name: 'Duel',
    description: 'Settle the score with a frenemy with a magical duel with guns, swords, and did I mention swords',
    extendedDescription: stripIndent`
			**Actions**
			-Click on one of the following buttons below to make your selection (can be changed anytime before the round ends). 
	
			**Reload/Gun (∞ use)**
			-Both players start with an unreloaded gun. Click the first time to reload your gun. Click the second to shoot your bullet!
			-**Reflected by the mirror causing the shooter to die**
			-**Blocked by a shield**
	
			**Sword (1 use)**
			-**Breaks through mirrors and kills opponent**
			-**Blocked by a shield**
	
			**Spell (1 use)**
			-**Breaks through shield and kills opponent**
			-**Blocked by a mirror**
	
			**Shield and Mirror (∞ use)**
			-**Used to defend against different attacks**
	
			**Speed Priority**
			Gun > Sword > Magical Sword
		`,

    // **Shield**
    // -**Blocks against the gun and sword**
    // -**Cannot defend against spell**

    // **Mirror**
    // -**Blocks against spell**
    // -**Reflects gun**
    // -**Cannot defend against sword**
  },
  hangman: {
    name: 'Hangman',
    description: 'Play the classic game of hangman',
    extendedDescription: stripIndent`
			Play the classic game of hangman by solving for the secret word by guessing letters!
			
			**Guessing Letters**
			-Enter a letter ranging from A-Z to guess a letter
			-If you guess a letter that is not in the secret word, you will lose a life
			-You cannot guess the same letter
			-You only have 8 lives
	
			**Ending**
			-The game ends once all the letters of the secret word have been solved or when you run out of lives
		`,
    alreadyGuessedLetterMessage: 'You have already guessed this letter, try again',
    gameOverMessage: 'Game over! The word was {{word}}',
    lettersGuessed: 'Letters Guessed',
    lives: 'Lives: {{lives}}',
    unboundLengthWarning: 'The max word length cannot be greater than minimum word length',
    winMessage: 'You win! The word was {{word}}',
  },
  help: {
    name: 'Help',
    description: 'Returns a list of commands or more details about a command',
    extendedDescription: 'Ah yes, use the help command to find what the help command does',

    aliasesName: 'Aliases',
    categoryOptionDescription: 'Commands from the {{group}} category',
    categoryPlaceholder: 'Select a category',
    clientPermissionsRequiredName: 'Client Permissions Required',
    commandTitle: 'Commands',
    descriptionName: 'Description',
    guildOnlyCommandFooter: 'Guild Only Command',
    infoName: 'Help Info',
    infoValue: stripIndent`
			{{- required, codeBlock}} - Required arguments
			{{optional, codeBlock}} - Optional arguments
			\`\`/help [command]\`\` - Get more details about the command
  	`,
    noCommandFound: 'No command found',
    seeAllCommands: 'See all commands',
    userPermissionsRequiredName: 'User Permission Required',
  },
  mastermind: {
    name: 'Mastermind',
    description: 'Guess the secret word by gaining clues in the form of "bulls" and "cows"',
    extendedDescription: stripIndent`
			Guess the secret word by guessing words and gaining clues in the form of **bulls** and "cows." You have a limited amount of turns to guess the word.
	
			**Guessing the Secret Word**
			-Enter a word that is the same length as the secret word
			-Example: if the secret word is **speed**, then your guess should be the something like **space**
	
			**Clues**
			-Clues will be shown upon guessing a word
			-**Bulls:** represent the amount of letters in the correct position and correct letter
			-**Cows:** represent the amount of correct letters in the wrong position.
			-In the example above, there would be **2 bulls** because the **sp** in both words are in the same position and correct letters. There is also one cow because the **e** in **space** is also in **speed** but in the incorrect position
	
			**End**
			-The game ends once the secret word is guessed or you run out of guesses
		`,
    gameOverMessage: '**Game over!** The word was **{{word}}**',
    giveUpMessage: 'You have given up! The word was **{{word}}**',
    guessInfo: '**{{word}}** - Bulls: **{{bulls}}**, Cows: **{{cows}}**',
    reminderText: 'Start by entering a {{length}}-letter word!',
    warningNotInDictionary: 'Word does not exist in the dictionary, try again',
    warningTooLong: 'Your word is too long, try again',
    warningTooShort: 'Your word is too short, try again',
    winMessage: '🎉 | Congrats, you guessed the word! The word was **{{word}}**',
  },
  minesweeper: {
    name: 'Minesweeper',
    description: 'Minesweeper, but with spoiler tags!',
    extendedDescription: 'Generates a minesweeper board with spoiler tags given the dimensions of the board and the number of mines',
    btnRefreshTimer: 'Refresh Timer',
    btnRevealMine: 'Reveal Mine',
    btnRevealSafe: 'Reveal Safe',
    generationText: 'Created a **{{height}}x{{width}}** with **{{mines}}** mines! Don\'t mess up!',
    onGiveUp: 'You have given up! Here\'s what the board looks like!',
    onRefreshTimer: 'Refreshed timer!',
    onSafeReveal: 'Looks **safe** at `[Row: {{row}}, Col: {{column}}]`',
    onMineReveal: 'Look out! There\'s a **mine** at `[Row: {{row}}, Col: {{column}}]`',
    tooManyMines: 'Hey! There\'s too many mines on the field. The amount of mines is larger than the area of the board!',
    tooLittleMines: 'Hey! There\'s too little mines on the field! You need at least one mine on the board!',
  },
  ping: {
    name: 'Ping',
    description: 'Replies with the bot ping test',
    extendedDescription: '🏓 Ping-pong',
  },
  rps: {
    name: 'RPS',
    description: 'Challenge one of your friends to a game of Rock, Paper, Scissor, Lizard, Spock!',
    extendedDescription: stripIndent`
			A classic two-player game. Choose Rock, Paper, Scissor, Lizard, or Spock and defeat your opponent!
	
			**Selecting**
			-Click on one of the following buttons below to make your selection. 
			-You may change your selection at any time during the round before the timer ends and when your opponent hasn't made a selection yet
	
			**Ending**
			-The game ends once a player reaches the required win amount set by the host
	
			**Guide (What beats what)**
			✊ **$t(rps.choiceRock)** -> ✌, 🤏 ($t(rps.choiceScissors), $t(rps.choiceLizard))
			✋ **$t(rps.choicePaper)** -> ✊, 🖖 ($t(rps.choiceRock), $t(rps.choiceSpock))
			✌ **$t(rps.choiceScissors)** -> ✋, 🤏 ($t(rps.choicePaper), $t(rps.choiceLizard))
			🤏 **$t(rps.choiceLizard)** -> 🖖, ✋ ($t(rps.choiceSpock), $t(rps.choicePaper))
			✋ **$t(rps.choiceSpock)** -> ✊, ✌  ($t(rps.choiceRock), $t(rps.choiceScissors))
		`,
    choiceRock: 'Rock',
    choiceRockWin: 'crushes',
    choicePaper: 'Paper',
    choicePaperWinRock: 'covers',
    choicePaperWinSpock: 'disapproves',
    choiceScissors: 'Scissors',
    choiceScissorsWinPaper: 'cuts',
    choiceScissorsWinLizard: 'decapitates',
    choiceLizard: 'Lizard',
    choiceLizardWinSpock: 'poisons',
    choiceLizardWinPaper: 'eats',
    choiceSpock: 'Spock',
    choiceSpockWinRock: 'vaporizes',
    choiceSpockWinScissors: 'smashes',
    drawMessage: 'It\'s a draw!',
    playerWinMessage: '**{{player.nickname}}** has masterfully won **$t(rps.name)**!',
    playerWinRoundMessage: '**{{player.nickname}}\'s** {{playerChoice}} {{action}} **{{other.nickname}}** {{otherChoice}}',
  },
  scrabble: {
    name: 'Scrabble',
    description: 'Given a set of random letters, find the greatest scoring word!',
    extendedDescription: stripIndent`
      Play a modified version of Scrabble. Each round, there will be 30 seconds for players to create the highest scoring word.
      
      **Scoring**
      -Each valid word is scored like so: (sum of each letter value in Scrabble * length of word). 
      -If all letters are used, then an additional 50 points is added! Letter values are displayed below! Additionally, blank tiles (🟨) are worth 0 points but can be used to fill any letters!
      -A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2
      -H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1
      -O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1
      -V: 4, W: 4, X: 8, Y: 4, Z: 10, 🟨: 0,
    
      **Ending**
      -The game ends once all rounds are completed
      -If the game played on multiplayer mode, then the highest scoring player wins!
		`,
    endSummaryTitle: 'All Rounds Summary + Highest Word',
    endRoundText: 'Round {{round}} -> {{word}} (+{{score}})',
    lettersText: '**Letters**',
    reminderText: 'Reminder that the word must be 3 letters or more. Yellow tiles are worth 0 points but can replace any letters',
    winSoloMessage: 'Congrats, you earned {{score}} points!',
    winMultiplayerMessage: '{{winners}} won with a total of **{{score}}** points',
  },
  trivia: {
    name: 'Trivia',
    description: 'Play against your friends in a game of trivia',
    extendedDescription: stripIndent`
			Flex your knowledge by guessing the correct answer to a trivia question to gain points! This uses the [Open Trivia DB API](https://opentdb.com/). 
			**Guessing an Answer**  
			-To select your answer, click on one of the buttons below the embed. 
			-You may change your answer any time before the timer runs out
	
			**Categories**
			-There are 25 categories to select from. Categories can range from mythology to music to computer science!
	
			**Scoring**
			-Multiple Choice: **1**, **2**, **3** points (depending on the difficulty)
			-True/False: **1** point
			
			**Ending**
			-The game ends once all the trivia rounds are completed
		`,
    answerText: '**Answer:**',
    correctUsersText: '🎉 | {{winners}} got the correct answer!',
    incorrectAnswerText: 'Nobody got the correct answer!',
    noAnswer: 'No answer!',
    possibleAnswersText: '**Possible Answers ({{points}} pts):**',
    questionText: '**Question:**',
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
  },
  yahtzee: {
    name: 'Yahtzee',
    description: 'Roll 5 dice and obtain a variety of number combinations to earn points!',
    extendedDescription: stripIndent`
      **Rerolling**
      -To select which dice you want to keep, select the reactions numbered 1-5. The reactions taht are **not** selected will be rerolled.
      -If you want to stop rerolling and immediately start selecting a category, click on the "**Play**" button
      -Otherwise, if you want to reroll, click on the "**Reroll**" button.
      -You have two rerolls

      **Selecting a Category**
      -Select which category in the dropdown menu to select where you rolls will go towards.

      **Scoring**
      -Your score is calculated through the sum of all the categories you earned.
      -You can a bonus (+35) bonus if categories 1-6 add up to 63 or more.
      -You can view how much points each category can give and their combination requirements below!
	`,
    categoryId: 'Category #{{id}}',
    categoryPlaceholder: 'Select a category',
    categoryChance: 'Chance',
    categoryFives: 'Fives',
    categoryFourOfAKind: 'Four of a Kind',
    categoryFours: 'Fours',
    categoryFullHouse: 'Full House',
    categoryLargeStraight: 'Large Staight',
    categoryOnes: 'Ones',
    categorySixes: 'Sixes',
    categorySmallStraight: 'Small Staight',
    categoryTwos: 'Twos',
    categoryThrees: 'Threes',
    categoryThreeOfAKind: 'Three of a Kind',
    playButtonText: '▶️ Play',
    rerollButtonText: '🎲 Reroll',
    rerollsLeft: '**Rerolls Left**',
    scoreSheetTitle: '$t(yahtzee.name) Score Sheet',
    selectCategoryText: '**Select a category to earn points**',
    totalPoints: '**Total Points**',
    winMessage: '**Nicely done! You have achieved a score of {{score}}!**',
    upperBonus: '**Upper Bonus - Total of Categories 1-6** {{emoji}}',
    yourRolls: '**🎲 Your Rolls 🎲**',
  },
};
