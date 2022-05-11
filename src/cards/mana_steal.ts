import type { Spell } from '.';
import { createVisualLobbingProjectile } from '../Projectile';
import floatingText from '../FloatingText';
import { explainManaOverfill } from '../Jprompt';

const id = 'mana_steal';
const mana_stolen = 20;
const health_burn = 3;
const spell: Spell = {
  card: {
    id,
    manaCost: 0,
    healthCost: health_burn,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'mana_steal.png',
    description: `
Sacrifice some of own health to steal up to ${mana_stolen} mana from each target.
    `,
    effect: async (state, dryRun) => {
      const caster = state.casterUnit;
      let promises = [];
      for (let unit of state.targetedUnits) {
        const unitManaBurnt = Math.min(unit.mana, mana_stolen);
        unit.mana -= unitManaBurnt;
        promises.push((dryRun ? Promise.resolve() : createVisualLobbingProjectile(unit, caster, 'blue-projectile.png')).then(() => {
          state.casterUnit.mana += unitManaBurnt;
          if (!dryRun) {
            explainManaOverfill();
            floatingText({
              coords: caster,
              text: `+ ${unitManaBurnt} Mana`,
              style: { fill: 'blue' }
            })
          }
        }));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
