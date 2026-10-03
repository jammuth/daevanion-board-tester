/**
 * Numbers from the saved-board count but skips titles already in use, so deleting a board
 * can't make the next default collide with an existing one.
 */
export function defaultBoardTitle(savedTitles: readonly string[]): string {
  const taken = new Set(savedTitles)
  let number = savedTitles.length + 1
  while (taken.has(`Board #${number}`)) number++
  return `Board #${number}`
}
