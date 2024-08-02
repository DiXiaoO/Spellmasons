import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const dareDevilId = 'Dare Devil';
const COST = 30;
export default function registerDareDevil() {
  registerModifiers(dareDevilId, {
    description: `Lose half of your max health for +${COST} stat points`,
    costPerUpgrade: -COST,
    maxUpgradeCount: 4,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, dareDevilId, { isCurse: false, quantity, keepOnDeath: true }, () => { });
      unit.healthMax = Math.floor(unit.healthMax / 2);
      unit.health = Math.floor(unit.health / 2);
      if (player == globalThis.player) {
        // Now that the player unit's properties have changed, sync the new
        // state with the player's predictionUnit so it is properly
        // reflected in the bar
        // (note: this would be auto corrected on the next mouse move anyway)
        underworld.syncPlayerPredictionUnitOnly();
        Unit.syncPlayerHealthManaUI(underworld);
      }
    },
  });


}
