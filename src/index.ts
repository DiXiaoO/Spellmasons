import PieClient, { ClientPresenceChangedArgs } from 'pie-client';
import Game, { game_state } from './Game';
import Player from './Player';
import Image from './Image';
import AnimationManager from './AnimationManager';
import { BOARD_HEIGHT } from './config';
import { getImage } from './Spell';
import * as UI from './ui/UserInterface';
UI.setup();

let clients = [];

const wsUri = 'ws://localhost:8000';
// const wsUri = 'ws://192.168.0.21:8000';
// const wsUri = 'wss://websocket-pie-e4elx.ondigitalocean.app/';
let pie: PieClient;
let game: Game = new Game();
let maxClients = 2;
function connect(_room_info = {}) {
  const room_info = Object.assign(_room_info, {
    app: 'Golems',
    version: '0.1.0',
    maxClients,
  });
  maxClients = room_info.maxClients;
  window.pie = pie = new PieClient({
    env: import.meta.env.MODE,
    wsUri: wsUri,
  });
  pie.onServerAssignedData = (o) => {
    console.log('serverAssignedData', o);
    window.clientId = o.clientId;
  };
  pie.onData = onData;
  pie.onError = ({ message }) => window.alert(message);
  pie.onClientPresenceChanged = onClientPresenceChanged;
  pie.onConnectInfo = (o) => {
    console.log('onConnectInfo', o);
    // Make and join room
    if (o.connected) {
      pie
        .makeRoom(room_info)
        // Since the room_info is hard-coded,
        // if you can't make the room, it may be already made, so try to join it instead.
        .catch(() => pie.joinRoom(room_info))
        .then(() => console.log('You are now in the room'))
        .catch((err: string) => console.error('Failed to join room', err));
    }
  };
}
export enum MESSAGE_TYPES {
  SPELL,
  END_TURN,
  LOAD_GAME_STATE,
  RESTART_GAME,
}

const messageLog = [];
window.saveReplay = (title) => {
  localStorage.setItem('golems-' + title, JSON.stringify(messageLog));
};
window.replay = (title) => {
  const messages = JSON.parse(localStorage.getItem('golems-' + title));
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    message.fromClient = game.players[0].clientId;
    onData(message);
  }
};
function cleanUpAllImages() {
  document.querySelectorAll('.game-image').forEach((i) => {
    i.remove();
  });
}
let onDataQueue = [];
function onData(d: { fromClient: string; payload: any }) {
  // Keep data messages in a queue until they are ready to be processed
  if (window.animationManager.animating) {
    onDataQueue.push(d);
    return;
  }
  console.log('onData', d);
  // Temporarily for development
  messageLog.push(d);

  const { payload, fromClient } = d;
  const { type, spell } = payload;
  // Get caster
  const caster = game.players.find((p) => p.clientId === fromClient);
  switch (type) {
    case MESSAGE_TYPES.RESTART_GAME:
      cleanUpAllImages();
      game = new Game();
      if (game.state == game_state.Lobby && clients.length === maxClients) {
        makeGame(clients);
      } else {
        alert('Could not restart game');
      }
      break;
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      cleanUpAllImages();
      // Resume game / load game / rejoin game
      const loadedGameState = { ...payload.game };
      const players = loadedGameState.players;
      const spells = loadedGameState.spells.map((s) => {
        return {
          caster: players.find((p) => p.clientId === s.caster.clientId),
          ...s,
        };
      });
      const units = loadedGameState.units.map((u) => {
        return {
          ...u,
          image: new Image(u.x, u.y, u.vx, u.vy, u.image.imageName),
        };
      });
      game.players = players;
      game.spells = spells;
      game.spellImages = spells.map(
        (s) => new Image(s.x, s.y, 0, 0, getImage(s)),
      );
      game.units = units;
      game.turn_finished = loadedGameState.turn_finished;
      game.setGameState(game_state.Playing);
      break;
    case MESSAGE_TYPES.SPELL:
      // Set caster based on which client sent it
      spell.caster = caster;
      game.queueSpell(spell);
      break;
    case MESSAGE_TYPES.END_TURN:
      game.turn_finished[fromClient] = true;
      if (fromClient == window.clientId) {
        UI.turnEnded(true);
      } else {
        UI.turnEndedOpponent();
      }
      let all_players_ended_turn = true;
      for (let p of game.players) {
        if (!game.turn_finished[p.clientId]) {
          all_players_ended_turn = false;
          break;
        }
      }
      if (all_players_ended_turn) {
        game.turn_finished = {};
        UI.turnEnded(false);
        game.nextTurn().then(() => {
          // Animations complete
          const queue = [...onDataQueue];
          // Clear the queue
          onDataQueue = [];
          // Allow new messages
          for (let d of queue) {
            onData(d);
          }
        });
      }
      break;
  }
}
function onClientPresenceChanged(o: ClientPresenceChangedArgs) {
  console.log('clientPresenceChanged', o);
  clients = o.clients;
  // Client joined
  if (o.present) {
    // Start game when maxClients reached
    if (game.state == game_state.Lobby && clients.length === maxClients) {
      makeGame(clients);
    } else if (game.state == game_state.WaitingForPlayerReconnect) {
      // Send game state to other player so they can load:
      pie.sendData({
        type: MESSAGE_TYPES.LOAD_GAME_STATE,
        game: {
          ...game,
          units: game.units.map((u) => {
            // Remove image.element
            const { element, ...rest } = u.image;
            return { ...u, image: rest };
          }),
        },
      });
    }
  } else {
    // Client left
    game.setGameState(game_state.WaitingForPlayerReconnect);
  }
}
function makeGame(clients: string[]) {
  game.setGameState(game_state.Playing);
  for (let i = 0; i < clients.length; i++) {
    const c = clients[i];
    const p = new Player();
    if (i == 0) {
      p.heart_y = -1;
    } else {
      p.heart_y = BOARD_HEIGHT;
    }
    p.heart = new Image(3.5, p.heart_y, 0, 0, 'heart.png');
    p.clientId = c;
    game.players.push(p);
    if (p.clientId === window.clientId) {
      UI.setCurrentMana(p.mana, p.mana);
    }
  }
}
window.connect = connect;

// Connect to PieServer
connect();
window.animationManager = new AnimationManager();

declare global {
  interface Window {
    connect: typeof connect;
    // Animation manager is globally accessable
    animationManager: AnimationManager;
    game: Game;
    pie: any;
    // Save pie messages for later replay
    saveReplay: (title: string) => void;
    // Used to replay onData messages for development
    replay: (messages: string[]) => void;
    // Current clients id
    clientId: string;
    // Debug on screen:
    setDebug: (json: object) => void;
  }
}
