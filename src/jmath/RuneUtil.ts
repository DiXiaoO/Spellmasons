import { getElementAtIndexLooped } from "./ArrayUtil";

type WithKey = { key: string };
export function presentRunes(allRunes: WithKey[], numOfRunesNeeded: number, startIndex: number, lockedRunes: { key: string, index: number }[]): string[] {
    let skippedLockedRunes = 0;
    const chosenRunes: string[] = []
    for (let i = 0; i < numOfRunesNeeded - lockedRunes.length + skippedLockedRunes; i++) {
        let chosen: string | undefined = getElementAtIndexLooped(allRunes, i + (startIndex || 0))?.key;
        // If a rune has been locked in this index, choose it; otherwise choose a seeded random rune
        if (chosen !== undefined) {
            const lockedRune = lockedRunes.find(lr => lr.key == chosen);
            if (lockedRune) {
                skippedLockedRunes++;
                continue;
            }
            // Found a unique rune
            chosenRunes.push(chosen);
        }
    }
    // Add locked runes in the indices that they belong in:
    for (let lr of lockedRunes) {
        chosenRunes.splice(lr.index, 0, lr.key);
    }
    return chosenRunes;

}