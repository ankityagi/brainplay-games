import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAMES } from '../src/lib/games';
import { GAME_COMPONENTS } from '../src/lib/registry';

describe('game registry', () => {
  it('gives every stage-based game a component', () => {
    for (const game of GAMES.filter((g) => !g.embedSrc)) {
      expect(GAME_COMPONENTS[game.id as keyof typeof GAME_COMPONENTS], game.id).toBeDefined();
    }
  });

  it('points every embedded game at a page that ships in public/', () => {
    for (const game of GAMES.filter((g) => g.embedSrc)) {
      expect(existsSync(resolve(__dirname, '../public', `.${game.embedSrc}`)), game.id).toBe(true);
    }
  });

  it('serves Zoom Valley with a local copy of three.js, not a CDN', () => {
    const html = readFileSync(resolve(__dirname, '../public/zoom-valley/index.html'), 'utf8');
    expect(html).toContain('<script src="/zoom-valley/three.min.js"></script>');
    expect(html).not.toContain('cdnjs');
    expect(existsSync(resolve(__dirname, '../public/zoom-valley/three.min.js'))).toBe(true);
  });
});

describe('Boundary Bash cricket page', () => {
  const html = readFileSync(resolve(__dirname, '../public/cricket/index.html'), 'utf8');

  it('is listed as the cricket game and opens its own page', () => {
    const game = GAMES.find((g) => g.id === 'cricket');
    expect(game?.embedSrc).toBe('/cricket/index.html');
  });

  it('loads no outside scripts', () => {
    expect(html).not.toMatch(/<script[^>]+src=/);
  });

  it('plays a 5-over innings of 6-ball overs', () => {
    expect(html).toContain('const OVERS = 5;');
    expect(html).toContain('const PER_OVER = 6;');
  });
});
