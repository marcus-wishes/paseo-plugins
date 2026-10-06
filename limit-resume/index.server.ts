import type { PluginServerContext } from "@getpaseo/plugin/server"
import { isLimitFailure } from "./server/detect-limit"
import { createQueue } from "./server/queue"
import { createRuntime } from "./server/runtime"
import { preferences } from "./shared/settings"
import { statusRpc } from "./shared/status"

export default function contribute(server: PluginServerContext) {
	const settings = server.registerSettings(preferences)
	const queue = createQueue()
	const runtime = createRuntime(settings, queue)

	server.handle(statusRpc, (_input, context) => {
		runtime.bindPaseo(context.paseo)
		return {
			queueSize: queue.size(),
			queued: queue.ids().map((agentId) => {
				const entry = queue.get(agentId)!
				return {
					agentId: entry.agentId,
					reason: entry.reason,
					attempts: entry.attempts,
					nextAttemptAt: entry.nextAttemptAt
				}
			})
		}
	})

	server.on("agent.turn_ended", async (event, context) => {
		runtime.bindPaseo(context.paseo)

		const current = await settings.read()
		if (current.status !== "ready" || !current.values.enabled) return
		if (event.outcome.kind === "canceled") return

		const intervalMs = current.values.intervalMinutes * 60_000

		if (isLimitFailure(event.outcome, event.timeline)) {
			const reason = event.outcome.kind === "failed" ? event.outcome.error.message : "limit pattern in timeline"
			const created = !queue.has(event.agent.id)
			queue.enqueue(event.agent.id, reason, Date.now() + intervalMs)
			console.log(created ? "[limit-resume] queued" : "[limit-resume] still_limited", {
				agentId: event.agent.id,
				reason,
				source: "turn_ended"
			})
			return
		}

		if (queue.dequeue(event.agent.id)) {
			console.log("[limit-resume] cleared", {
				agentId: event.agent.id,
				reason: "recovered"
			})
		}
	})

	server.on("agent.created", (_event, context) => {
		runtime.bindPaseo(context.paseo)
	})

	server.on("agent.archived", (event, context) => {
		runtime.bindPaseo(context.paseo)
		if (queue.dequeue(event.agent.id)) {
			console.log("[limit-resume] cleared", {
				agentId: event.agent.id,
				reason: "archived"
			})
		}
	})

	return () => {
		runtime.dispose()
	}
}
