export interface QueuedAgent {
	agentId: string
	reason: string
	enqueuedAt: number
	attempts: number
	nextAttemptAt: number
}

export function createQueue() {
	const entries = new Map<string, QueuedAgent>()

	return {
		enqueue(agentId: string, reason: string, nextAttemptAt: number): QueuedAgent {
			const existing = entries.get(agentId)
			if (existing) {
				existing.reason = reason
				return existing
			}
			const entry: QueuedAgent = {
				agentId,
				reason,
				enqueuedAt: Date.now(),
				attempts: 0,
				nextAttemptAt
			}
			entries.set(agentId, entry)
			return entry
		},

		dequeue(agentId: string): boolean {
			return entries.delete(agentId)
		},

		get(agentId: string): QueuedAgent | undefined {
			return entries.get(agentId)
		},

		has(agentId: string): boolean {
			return entries.has(agentId)
		},

		due(now: number, limit: number): QueuedAgent[] {
			const result: QueuedAgent[] = []
			for (const entry of entries.values()) {
				if (entry.nextAttemptAt > now) continue
				result.push(entry)
				if (result.length >= limit) break
			}
			return result
		},

		markAttempt(agentId: string, nextAttemptAt: number): void {
			const entry = entries.get(agentId)
			if (!entry) return
			entry.attempts += 1
			entry.nextAttemptAt = nextAttemptAt
		},

		defer(agentId: string, nextAttemptAt: number): void {
			const entry = entries.get(agentId)
			if (!entry) return
			entry.nextAttemptAt = nextAttemptAt
		},

		size(): number {
			return entries.size
		},

		ids(): string[] {
			return [...entries.keys()]
		}
	}
}

export type LimitResumeQueue = ReturnType<typeof createQueue>
