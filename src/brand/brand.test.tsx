import { render, screen, within } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getTopic } from '../content/registry'
import type { TopicBundle } from '../content/topics'
import { MapScreen } from '../map/MapScreen'
import { buildCues } from '../narration/cues'
import { installFakeAudio } from '../narration/fake-audio'
import { TutorialPage } from '../tutorial/TutorialPage'
import { HIATOOLS_URL, SITE_URL } from './brand'

const root = join(import.meta.dirname, '../..')
const html = readFileSync(join(root, 'index.html'), 'utf8')
const meta = (attr: string, key: string) => html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"`))?.[1]

test('endereços combinados', () => {
  expect(SITE_URL).toBe('https://tutorial.hiatools.com.br/')
  expect(HIATOOLS_URL).toBe('https://hiatools.com.br')
})

test('index.html tem título, descrição e endereço canônico', () => {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''
  expect(title).toMatch(/agente de IA/i)
  expect(title).toMatch(/hIAtools/)
  expect(title.length).toBeLessThanOrEqual(65)
  const desc = meta('name', 'description') ?? ''
  expect(desc.length).toBeGreaterThanOrEqual(110)
  expect(desc.length).toBeLessThanOrEqual(165)
  expect(html).toContain('<link rel="canonical" href="https://tutorial.hiatools.com.br/"')
  expect(html).toContain('<html lang="pt-BR"')
})

test('prévia de link: Open Graph e Twitter com imagem em endereço completo', () => {
  expect(meta('property', 'og:type')).toBe('website')
  expect(meta('property', 'og:url')).toBe('https://tutorial.hiatools.com.br/')
  expect(meta('property', 'og:site_name')).toBe('hIAtools')
  expect(meta('property', 'og:locale')).toBe('pt_BR')
  expect(meta('property', 'og:title')).toBeTruthy()
  expect(meta('property', 'og:description')).toBeTruthy()
  expect(meta('property', 'og:image')).toBe('https://tutorial.hiatools.com.br/og.png')
  expect(meta('property', 'og:image:width')).toBe('1200')
  expect(meta('property', 'og:image:height')).toBe('630')
  expect(meta('property', 'og:image:alt')).toBeTruthy()
  expect(meta('name', 'twitter:card')).toBe('summary_large_image')
  expect(meta('name', 'twitter:image')).toBe('https://tutorial.hiatools.com.br/og.png')
})

test('arquivos públicos de SEO existem: imagem 1200×630, ícones, robots e sitemap', () => {
  const og = readFileSync(join(root, 'public/og.png'))
  expect(og.subarray(1, 4).toString()).toBe('PNG')
  expect([og.readUInt32BE(16), og.readUInt32BE(20)]).toEqual([1200, 630])
  expect(og.length).toBeLessThan(600_000)
  for (const f of ['favicon.svg', 'apple-touch-icon.png']) expect(existsSync(join(root, 'public', f)), f).toBe(true)
  expect(readFileSync(join(root, 'public/robots.txt'), 'utf8')).toContain('Sitemap: https://tutorial.hiatools.com.br/sitemap.xml')
  expect(readFileSync(join(root, 'public/sitemap.xml'), 'utf8')).toContain('<loc>https://tutorial.hiatools.com.br/</loc>')
})

test('dados estruturados válidos, com a hIAtools como quem publica', () => {
  const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
  const data = JSON.parse(raw!)
  expect(data['@type']).toBe('LearningResource')
  expect(data.inLanguage).toBe('pt-BR')
  expect(data.url).toBe('https://tutorial.hiatools.com.br/')
  expect(data.publisher).toMatchObject({ '@type': 'Organization', name: 'hIAtools', url: 'https://hiatools.com.br' })
})

test('sem JavaScript, a página ainda tem texto e o convite da hIAtools', () => {
  const fallback = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/)?.[1] ?? ''
  expect(fallback).toMatch(/<h1>/)
  expect(fallback).toContain('href="https://hiatools.com.br"')
  for (const t of ['RAG', 'MCP', 'Guardrails', 'Evals']) expect(fallback).toContain(t)
})

test('mapa: assinatura da hIAtools e botão para criar um agente', () => {
  render(<MapScreen onOpen={() => {}} />)
  const cta = screen.getByRole('link', { name: /Quero um agente/ })
  expect(cta).toHaveAttribute('href', HIATOOLS_URL)
  expect(cta).toHaveAttribute('target', '_blank')
  expect(cta.getAttribute('rel')).toContain('noopener')
  expect(screen.getByRole('link', { name: 'hIAtools' })).toHaveAttribute('href', HIATOOLS_URL)
})

test('tutorial: convite para marcar uma reunião com a hIAtools antes do próximo assunto', () => {
  installFakeAudio()
  const bundle: TopicBundle = {
    meta: getTopic('rag')!,
    Scene: () => <div />,
    cues: buildCues([{ text: 'x', duration: 1 }]),
    audioSrc: '/a.m4a',
    Tutorial: () => <h2>O que é</h2>,
  }
  render(<TutorialPage bundle={bundle} onBack={() => {}} />)
  const box = screen.getByRole('complementary', { name: 'Crie seu agente com a hIAtools' })
  expect(box).toHaveTextContent(/reunião/)
  expect(within(box).getByRole('link', { name: /Marcar uma reunião/ })).toHaveAttribute('href', HIATOOLS_URL)
  const order = [box, screen.getByRole('heading', { name: 'Próximo assunto' })]
  expect(order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
