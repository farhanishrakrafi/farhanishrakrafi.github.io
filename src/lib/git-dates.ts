import { execFileSync } from 'node:child_process';

const cache = new Map<string, Date | undefined>();

/**
 * Date of the latest commit that touched `path` (or the whole repository).
 * Needs full Git history, so the deploy workflow checks out with fetch-depth 0.
 */
export function lastCommitDate(path?: string): Date | undefined {
  const key = path ?? '.';
  if (cache.has(key)) return cache.get(key);
  let date: Date | undefined;
  try {
    const args = ['log', '-1', '--format=%cI'];
    if (path) args.push('--', path);
    const out = execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    date = out ? new Date(out) : undefined;
  } catch {
    date = undefined;
  }
  cache.set(key, date);
  return date;
}
