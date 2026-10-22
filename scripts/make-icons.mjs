// Renders public/icon.svg into the PNG icons the manifest and iOS need.
// Run after changing the SVG: node scripts/make-icons.mjs
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const svg = readFileSync('public/icon.svg', 'utf8')
// maskable and Apple icons are cropped by the system, so they fill the square
const square = svg.replace(' rx="112"', '')

const icons = [
  ['public/icon-192.png', svg, 192],
  ['public/icon-512.png', svg, 512],
  ['public/icon-maskable-512.png', square, 512],
  ['public/apple-touch-icon.png', square, 180],
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const [file, source, size] of icons) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${source}`
  )
  await page.screenshot({ path: file, omitBackground: true })
}
await browser.close()
