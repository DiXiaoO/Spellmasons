// @ts-ignore
import wsPie from 'pie-client';
import Game from './Game';
import Player from './Player';
import type { Spell } from './Spell';
import Unit from './Unit';
let clientId = 0;
let clients = [];

const wsUri = 'wss://websocket-pie-e4elx.ondigitalocean.app/';
let pie: any;
let game: Game;
let max_clients = 2;
function connect(pieArgs = {}, _room_info = {}) {
  const room_info = Object.assign(_room_info, {
    app: 'Golems',
    version: '0.1.0',
    max_clients,
  });
  max_clients = room_info.max_clients;
  pie = new wsPie(
    Object.assign(
      {
        env: import.meta.env.MODE,
        wsUri: wsUri,
        onServerAssignedData: (o: any) => {
          console.log('serverAssignedData', o);
          clientId = o.clientId;
        },
        onClientPresenceChanged,
        onConnectInfo: (o: any) => {
          console.log('onConnectInfo', o);
          // Make and join room
          if (o.connected) {
            pie
              .makeRoom(room_info)
              // Since the room_info is hard-coded,
              // if you can't make the room, it may be already made, so try to join it instead.
              .catch(() => pie.joinRoom(room_info))
              .then(() => console.log('You are now in the room'))
              .catch((err: string) =>
                console.error('Failed to join room', err),
              );
          }
        },
        onData,
      },
      pieArgs,
    ),
  );
}
// Keeps track of which players have ended their turn
let turn_finished = {};
enum MESSAGE_TYPES {
  SPELL,
  END_TURN,
}
function onData(d: {
  fromClient: string;
  payload: {
    type: MESSAGE_TYPES;
    spell?: Spell;
  };
}) {
  console.log('onData', d);
  const { payload, fromClient } = d;
  const { type, spell } = payload;
  // Get caster
  const caster = game.players.find((p) => p.client_id === fromClient);
  switch (type) {
    case MESSAGE_TYPES.SPELL:
      // Set caster based on which client sent it
      spell.caster = caster;
      game.queueSpell(spell);
      break;
    case MESSAGE_TYPES.END_TURN:
      turn_finished[fromClient] = true;
      let all_players_ended_turn = true;
      for (let p of game.players) {
        if (!turn_finished[p.client_id]) {
          all_players_ended_turn = false;
          break;
        }
      }
      if (all_players_ended_turn) {
        turn_finished = {};
        game.nextTurn();
      }
      break;
  }
}
function onClientPresenceChanged(o: any) {
  console.log('clientPresenceChanged', o);
  clients = o.clients;
  // Start game when max_clients reached
  if (pie && clients.length === max_clients) {
    makeGame(clients);
  } else {
    console.error('Failed to make game');
  }
}
function makeGame(clients: string[]) {
  if (!game) {
    console.log('Initialize game state');
    game = new Game();
    for (let c of clients) {
      const p = new Player();
      p.client_id = c;
      game.players.push(p);
    }
    // Start animations
    game.animate(0);

    // Test; TODO remove
    const u = new Unit(0, 0, 0, 1, 'crocodile.png');
    game.summon(u);
    game.summon(new Unit(0, 3, 0, 0, 'crocodile.png'));
    window.game = game;
  }
}
window.connect = connect;

// Connect to PieServer

connect();

declare global {
  interface Window {
    connect: typeof connect;
    game: Game;
  }
}
