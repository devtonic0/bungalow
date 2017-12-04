const Team = require('./team')

class Game {
  constructor (teams, board) {
    this.GAME_TIME_LIMIT_IN_MILLISECONDS = 30000
    this.startTimestamp = new Date().getTime()
    this.isPreGameLobby = true;
    this.SPECTATORS_TEAM_NAME = 'spectators'
    console.log('Hi, Clickty-Clack.')
    this.events = []            
    this.teams = teams
    this.board = board
    this.players = {}
    this.commands = {}
    this.winner = ''
    this.setupSpectators()
  }

  setupSpectators () {
    this.teams[this.SPECTATORS_TEAM_NAME] = new Team(this.SPECTATORS_TEAM_NAME)
  }

  get state () {
    let events = this.events
    this.events = []
    events = events.concat(this.board.events)
    return {
      'teams': this.teams,
      'controllables': this.board.controllables,
      'events': events,
      'timeLimit': {
        'isPregameLobby': this.isPreGameLobby,
        'total': this.GAME_TIME_LIMIT_IN_MILLISECONDS,
        'remaining': this.getRemainingTime()
      },
      'winner': this.winner
    }
  }

  start (board, teams) {
    console.log('Starting game')
    this.isPreGameLobby = false
    this.startTimestamp = new Date().getTime()
    this.board = board
    this.teams = teams
  }

  initializePlayer (aPlayer) {
    this.queueEventJoin(aPlayer)
    this.players[aPlayer.id] = aPlayer
    this.addToTeam(this.SPECTATORS_TEAM_NAME, aPlayer)
  }

  joinTeam (aTeamName, aPlayer) {
    this.queueEventJoinTeam(aTeamName, aPlayer)
    this.leaveCurrentTeam(aPlayer)
    this.addToTeam(aTeamName, aPlayer)
  }

  leaveCurrentTeam (aPlayer) {
    var teamName = aPlayer.teamName
    var team = this.teams[teamName]
    aPlayer.quit()
    team.remove(aPlayer)
  }

  addToTeam (aTeamName, aPlayer) {
    console.log(`${aPlayer.id} has joined team: ${aTeamName}`)
    var team = this.teams[aTeamName]
    var aControllable = team.findOpenControllable()
    aPlayer.assignControllable(aControllable)
    aPlayer.teamName = aTeamName
    team.push(aPlayer)
  }

  terminatePlayer (aPlayer) {
    this.queueEventTerminatePlayer(aPlayer)
    delete this.players[aPlayer.id]
    this.leaveCurrentTeam(aPlayer)
  }

  queue (aPlayer, commands) {
    this.commands[aPlayer.id] = commands
  }

  tick () {
    if (this.isGameOver()) {
      // TODO NEXT this.setupPregameLobby()
      return
    }
    for (var id in this.commands) {
      var aPlayer = this.players[id]
      var commands = this.commands[id]
      this.processCommands(aPlayer, commands)
    }
    for (var id in this.players) {
      var aPlayer = this.players[id]
      var events = aPlayer.tick(this.board)
      if (events) {
        this.events = this.events.concat(events)
      }
    }
    this.commands = {}
  }

  processCommands (player, commands) {
    commands.map((c) => {
      console.log(c)
     player.do(this.board, c)
    })
  }

  queueEventJoin (aPlayer) {
    this.events.push({
      message: `👋 Welcome ${aPlayer.name}!`,
      type: 'initialize'
    })
  }

  queueEventJoinTeam(aTeamName, aPlayer) {
    this.events.push({
      message: `📣 ${aPlayer.name} switched from ${aPlayer.teamName} to ${aTeamName}`,
      type: 'joinTeam'
    })
  }

  queueEventTerminatePlayer(aPlayer) {
    this.events.push({
      message: `👋 ${aPlayer.name} quit`,
      type: 'terminatePlayer'
    })
  }

  queueEventReadyStatus(aPlayer, status) {
    var message
    if (status) {
      message = `👍 ${aPlayer.name} is ready`
    } else {
      message = `👎 ${aPlayer.name} is not ready`
    }
    this.events.push({
      message: message,
      type: 'setReadyStatus'
    })
  }

  queueEventWin(aWinnerString) {
    this.events.push({
      message: `🎉 ${aWinnerString} win the game`,
      type: 'win'
    })
  }

  areEnoughPlayersReady() {
    return true
  }

  getRemainingTime() {
    var whenTheGameEnds = this.GAME_TIME_LIMIT_IN_MILLISECONDS + this.startTimestamp
    return whenTheGameEnds - new Date().getTime()
  }

  isGameOver() {
    if (this.isPreGameLobby) {
      return false
    }
    if (this.teams['Houses'].hasAliveControllables() === false) {
      this.winner = 'Giants'
      this.queueEventWin(this.winner)
      return true
    }  
    if (this.getRemainingTime() < 0) {
      this.winner = 'Houses'
      this.queueEventWin(this.winner)      
      return true
    }
    return false
  }

  setReadyStatus(aPlayer, status) {
    this.queueEventReadyStatus(aPlayer, status)
    this.teams[aPlayer.teamName].setReadyStatus(aPlayer, status)
  }
}

module.exports = Game
