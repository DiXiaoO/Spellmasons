import * as PIXI from 'pixi.js';
import * as storage from './storage';
import * as config from './config';
import { robeColors } from './graphics/ui/colors';
// globalThis.pixi must be set before ANY other js files are
// processes so that files know that this isn't a headless
// instance
globalThis.pixi = PIXI;

// Setup globals that svelte-bundle menu needs

globalThis.setupPixiPromise = new Promise((resolve) => {
    globalThis.pixiPromiseResolver = resolve;
})
globalThis.volume = 1.0;
globalThis.volumeMusic = 0.5;
globalThis.volumeGame = 0.25;
// TODO: Remove from svelte menu, music is now played when level is created.
// TODO: Ensure music works on electron without being associated with a button press
globalThis.playMusic = () => { };
// Default stored color if player doesn't already have one stored
const color = storage.get(config.STORAGE_ID_PLAYER_COLOR);
if (!color) {
    const newColor = robeColors[Math.floor(Math.random() * robeColors.length)] || 0xef476f;
    storage.set(config.STORAGE_ID_PLAYER_COLOR, newColor);
}
console.log('Setup: presetup.ts')