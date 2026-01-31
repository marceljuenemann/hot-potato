export type HotPotatoTokenId = string;

export function parseTokenId(value: string): HotPotatoTokenId {
  if (!value.trim()) {
    throw new Error('token id must be a non-empty string');
  }
  return value;
}
