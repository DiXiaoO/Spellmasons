import * as Unit from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';
import { UnitType } from '../commonTypes';
import { CardType, cardTypeToProbability } from './cardUtils';

const id = 'freeze';
const type = CardType.Common;
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'freeze.png',
    description: `
Freezes the target(s) for 1 turn, preventing them from moving or acting.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          addTo(unit);
          if (unit.unitType === UnitType.PLAYER_CONTROLLED) {
            const player = window.underworld.players.find(
              (p) => p.unit === unit,
            );
            if (player) {
              window.underworld.endPlayerTurn(player.clientId);
            }
          }
        }
      }
      return state;
    },
  },
  events: {
    onTurnStart: (unit: Unit.IUnit) => {
      // Decrement how many turns left the unit is frozen
      unit.modifiers[id] && unit.modifiers[id].turnsLeft--;
      if (unit.modifiers[id] && unit.modifiers[id].turnsLeft <= 0) {
        Unit.removeModifier(unit, id);
      }
      // Ensure that the unit cannot move when frozen
      // (even when players' turns are ended they can still act so long
      // as it is underworld.turn_phase === turn_phase.PlayerTurns, this is because all players act simultaneously
      // during that phase, so setting unit.thisTurnMoved = true prevents players from moving when they are frozen)
      // and then returning true also ends their turn.
      unit.thisTurnMoved = true;
      // Abort turn
      return true;
    },
  },
  subsprites: {
    freeze: {
      imageName: 'freeze.png',
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  },
};

function addTo(unit: Unit.IUnit) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = { isCurse: true };
    // Add event
    unit.onTurnStartEvents.push(id);

    // Add subsprite image
    Image.addSubSprite(unit.image, id);
  }
  // Increment the number of turns that freeze is applied (can stack)
  unit.modifiers[id].turnsLeft = (unit.modifiers[id].turnsLeft || 0) + 1;
}

export default spell;
