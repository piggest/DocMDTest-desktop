import type { EditRequest } from './types';

export function parseEditUrl(url: string): EditRequest | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'cnfr:') return null;
    if (u.hostname !== 'edit') return null;
    const path = u.searchParams.get('path');
    if (!path) return null;
    return { action: 'edit', path };
  } catch {
    return null;
  }
}
