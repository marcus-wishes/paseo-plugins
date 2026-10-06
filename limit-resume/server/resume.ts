import type { PaseoApi } from "@getpaseo/client"
import type { LimitResumeSettings } from "../shared/settings"
import { isLimitErrorMessage } from "./detect-limit"
import type { LimitResumeQueue } from "./queue"

const RESUME_CONCURRENCY = 1

function log(event: string, detail: Record<string, unknown>): void {
	console.log(`[limit-resume] ${event}`, detail)
}

export async function scanErrorAgents(
	paseo: PaseoApi,
	queue: LimitResumeQueue,
	settings: LimitResumeSettings
): Promise<void> {
	const page = await paseo.agents.list({
		filter: { statuses: ["error"], includeArchived: false }
	})

	const intervalMs = settings.intervalMinutes * 60_000
	const errorIds = new Set<string>()

	for (const entry of page.entries) {
		const agent = entry.agent
		errorIds.add(agent.id)
		if (!isLimitErrorMessage(agent.lastError)) continue

		const reason = agent.lastError ?? "error status"
		if (!queue.has(agent.id)) {
			queue.enqueue(agent.id, reason, Date.now() + intervalMs)
			log("queued", { agentId: agent.id, reason, source: "scan" })
		}
	}

	for (const id of queue.ids()) {
		if (errorIds.has(id)) continue
		const handle = paseo.agents.ref(id)
		const snap = await handle.refresh()
		if (!snap || handle.archivedAt || handle.status === "closed") {
			queue.dequeue(id)
			log("cleared", { agentId: id, reason: "missing_or_closed" })
		}
	}
}

export async function resumeDueAgents(
	paseo: PaseoApi,
	queue: LimitResumeQueue,
	settings: LimitResumeSettings
): Promise<void> {
	const now = Date.now()
	const intervalMs = settings.intervalMinutes * 60_000

	for (const entry of queue.due(now, RESUME_CONCURRENCY)) {
		if (entry.attempts >= settings.maxAttempts) {
			queue.dequeue(entry.agentId)
			log("cleared", { agentId: entry.agentId, reason: "max_attempts" })
			continue
		}

		const handle = paseo.agents.ref(entry.agentId)
		const snap = await handle.refresh()
		if (!snap || handle.archivedAt || handle.status === "closed") {
			queue.dequeue(entry.agentId)
			log("cleared", { agentId: entry.agentId, reason: "missing_or_closed" })
			continue
		}
		if (handle.status === "running" || handle.status === "initializing") {
			queue.defer(entry.agentId, now + 60_000)
			log("resume_deferred", { agentId: entry.agentId, status: handle.status })
			continue
		}

		if (settings.dryRun) {
			queue.markAttempt(entry.agentId, now + intervalMs)
			log("resume_sent", {
				agentId: entry.agentId,
				dryRun: true,
				attempts: entry.attempts,
				prompt: settings.continuePrompt
			})
			continue
		}

		try {
			await handle.send(settings.continuePrompt)
			queue.markAttempt(entry.agentId, now + intervalMs)
			log("resume_sent", {
				agentId: entry.agentId,
				dryRun: false,
				attempts: entry.attempts
			})
		} catch (error) {
			queue.markAttempt(entry.agentId, now + intervalMs)
			log("resume_failed", {
				agentId: entry.agentId,
				error: error instanceof Error ? error.message : String(error),
				attempts: entry.attempts
			})
		}
	}
}
