import { it } from 'vitest'
import { parseShareHash } from '../share'
const urls = {
  Nezekan: 't=Chanter+-+Nezekan&b=11.VFLPLVDGBGBLFIFQKFBBBBGQGHGIAFAFDGHGGQGBBBAFLPIFGLBGBIBVKQKGU',
  Vaizel: 't=Chanter+-+Vaizel&b=11.VKIHGVBGBBBIFQGQKFBCAFGHGGQIAFAFDGQGHGFFCBAFLQGPIGBBBGBVHIFLU',
  Zikel: 't=Chanter+-+Zikel&b=11.VGQLQVCBAFBQFGQHGBHBBBGPFHGPFBBAFQHFFQGBBCGBHGQFGQAFBCBVQLQGU',
  Triniel: 't=Chanter+-+Triniel&b=13.VFBVAGVDGKLIBFFBGAFIGLFIGHAFFAFBBGIGGHGPFFAFFQHGGIGGBAFAFFCGIFGLIFFBGAFGDGKLIBVFBVAGU',
  Azphel: 't=Chanter+-+Azphel&b=15.VICJCIGVAGFFFBBLHBLIGLKBABBBBAQFQIHGPBCGBAFBHFAGLIGKJGAFAFBJFLIGLFAHGAFBBHBAQHIGPGPBBBBABALLIGLCGLBAFFGFBVIHEHDGU',
}
const sym = { off: 'x', on: 'o', passive: 'g', skill: 'b', important: 'r', start: 'S' } as const
it('decode', () => {
  for (const [name, hash] of Object.entries(urls)) {
    const shared = parseShareHash('#' + hash)
    if (!shared) { console.log(name, 'FAILED TO DECODE'); continue }
    const { size, tiles } = shared.board
    const counts = tiles.reduce((m, t) => ((m[t] = (m[t] ?? 0) + 1), m), {} as Record<string, number>)
    console.log(`== ${name} (${shared.title}) ${size}x${size} ${JSON.stringify(counts)}`)
    for (let r = 0; r < size; r++) console.log('  ' + tiles.slice(r * size, r * size + size).map((t) => sym[t]).join(' '))
  }
})
