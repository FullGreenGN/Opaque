/**
 * Minimal in-process sliding-window rate limiter. Good enough for a single
 * server instance; move to a shared store (e.g. Redis) before running more
 * than one API instance, since limits here are per-process and reset on
 * deploy/restart.
 */

interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();

let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweepExpired(now: number) {
	if (now - lastSweep < SWEEP_INTERVAL_MS) {
		return;
	}
	lastSweep = now;
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) {
			buckets.delete(key);
		}
	}
}

/** Returns true if the call is allowed, false if the caller is over the limit. */
export function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number,
): boolean {
	const now = Date.now();
	sweepExpired(now);

	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	if (bucket.count >= limit) {
		return false;
	}

	bucket.count += 1;
	return true;
}
