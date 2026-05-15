/**
 * Converts projecthub.png → projecthub.ico (256, 128, 64, 48, 32, 16 px layers).
 * Run once before a Windows release build: npm run generate-icons
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pngToIco from 'png-to-ico'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src  = join(root, 'projecthub.png')
const dest = join(root, 'projecthub.ico')

if (!readFileSync(src)) {
  console.error('projecthub.png not found at project root.')
  process.exit(1)
}

const buf = await pngToIco(src)
writeFileSync(dest, buf)
console.log(`Generated ${dest} (${buf.byteLength} bytes)`)
