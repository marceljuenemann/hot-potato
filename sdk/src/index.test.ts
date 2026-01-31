import { describe, expect, it } from 'vitest';

import { parseTokenId } from './index';

describe('parseTokenId', () => {
  it('returns the token id for non-empty input', () => {
    expect(parseTokenId('42')).toBe('42');
  });

  it('throws for empty input', () => {
    expect(() => parseTokenId('  ')).toThrow('token id must be a non-empty string');
  });
});
