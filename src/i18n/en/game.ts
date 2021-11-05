export default {
  game: {
    detailsText: 'Game Details',
    challengeMessage: '{{playerNickname}} has challenged {{otherPlayerNickname}} in $t({{game}}.name)!',
    cannotChallengeBot: 'You cannot challenge a bot!',
    cannotChallengeYourself: 'You cannot challenge yourself',
    cannotHostGame: 'You are already hosting/playing another game in this channel!',
    declineMessage: '**{{nickname}}** has declined or did not the accept the challenge in time',
    inactivityMessage: '$t({{game}}.name) has ended due to inactivity...',
    firstToWins: 'First to {{wins}} win(s)!',
    giveUp: 'Give Up',
    playerInactivityMessage: '$t({{game}}.name) because one of the players was inactive',
    round: 'Round: {{- round}}',
    scores: 'Scores',
    scoreValue: 'Score: {{value}}',
    standings: 'Standings',
    turn: 'Turn: {{- turn}}',
    logs: 'Logs',
    multiplayerEmbed: {
      aliases: '**Aliases** - {{aliasesText}}',
      btnEndGameText: 'End Game',
      btnCommandOnEnd: '**{{nickname}}** has ended $t({{game}}.name)',
      btnCommandOnJoin: '`{{user}} has joined!`',
      btnCommandOnLeave: '`{{user}} has left!`',
      btnJoinText: 'Join',
      btnLeaveText: 'Leave',
      btnStartGameText: 'Start Game',
      commandFormat: '`{{cmd.name}} <{{cmd.args}}>` - {{cmd.description}}',
      canBegin: '**Can Begin**',
      currentPlayers: '**Current Players** ({{total}})',
      hostCommands: '**Host Subcommands** (`{{prefix}}`)',
      maxPlayers: '**Max Players**',
      minPlayers: '**Min Players**',
      title: '{{user.nickname}} has started a game of $t({{game}}.name)!',
      commands: {
        userArg: '@user',
        invite: {
          description: 'Automatically add a player to the game',
          onSuccess: '`Invited {{user}}`',
          onFail: '`Could not invite {{user}} due to max player limit`',
        },
        kick: {
          description: 'Kick a player out of the game',
          onSuccess: '`Kicked {{user}}`',
        },
        unkick: {
          description: 'Unkick a player out of the game',
          onSuccess: '`Unkicked {{user}}`',
        },
      },
    },
  },
};
