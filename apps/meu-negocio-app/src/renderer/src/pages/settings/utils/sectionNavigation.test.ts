import { describe, expect, it } from 'vitest';
import { moveSection } from './sectionNavigation';

const ORDER = ['company', 'backup', 'about'] as const;

describe('moveSection', () => {
  it('advances to the next section with ArrowRight and ArrowDown', () => {
    expect(moveSection(ORDER, 'company', 'ArrowRight')).toBe('backup');
    expect(moveSection(ORDER, 'company', 'ArrowDown')).toBe('backup');
  });

  it('goes back with ArrowLeft and ArrowUp', () => {
    expect(moveSection(ORDER, 'about', 'ArrowLeft')).toBe('backup');
    expect(moveSection(ORDER, 'about', 'ArrowUp')).toBe('backup');
  });

  it('wraps around at both ends', () => {
    expect(moveSection(ORDER, 'about', 'ArrowRight')).toBe('company');
    expect(moveSection(ORDER, 'company', 'ArrowLeft')).toBe('about');
  });

  it('jumps to the ends with Home and End', () => {
    expect(moveSection(ORDER, 'backup', 'Home')).toBe('company');
    expect(moveSection(ORDER, 'backup', 'End')).toBe('about');
  });

  it('ignores keys that do not navigate', () => {
    expect(moveSection(ORDER, 'backup', 'Enter')).toBeNull();
    expect(moveSection(ORDER, 'backup', 'Tab')).toBeNull();
  });

  it('ignores a current section that is not in the list', () => {
    expect(moveSection(ORDER, 'other', 'ArrowRight')).toBeNull();
  });
});
