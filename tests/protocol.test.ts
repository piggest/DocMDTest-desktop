import { describe, it, expect } from 'vitest';
import { parseEditUrl } from '../src/protocol';

describe('parseEditUrl', () => {
  it('extracts path from cnfr://edit?path=X', () => {
    const url = 'cnfr://edit?path=docs%2F%E3%82%AC%E3%82%A4%E3%83%89%2Ftest.md';
    expect(parseEditUrl(url)).toEqual({ action: 'edit', path: 'docs/ガイド/test.md' });
  });

  it('returns null for unknown action', () => {
    expect(parseEditUrl('cnfr://unknown')).toBeNull();
  });

  it('returns null for missing path on edit', () => {
    expect(parseEditUrl('cnfr://edit')).toBeNull();
  });

  it('handles literal percent in path (%25)', () => {
    // searchParams.get auto-decodes %2525 → %25
    expect(parseEditUrl('cnfr://edit?path=foo%2525bar')).toEqual({
      action: 'edit', path: 'foo%25bar',
    });
  });

  it('returns null when protocol is wrong', () => {
    expect(parseEditUrl('docmdview://edit?path=x')).toBeNull();
  });

  it('returns null when path query is empty', () => {
    expect(parseEditUrl('cnfr://edit?path=')).toBeNull();
  });
});
