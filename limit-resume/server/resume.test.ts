import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { PaseoApi } from "@getpaseo/client"
import { createQueue } from "./queue"
import { resumeDueAgents, scanErrorAgents } from "./resume"
import { DEFAULT_CONTINUE_PROMPT } from "../shared/settings"

function mockPaseo(
	agents: Array<{
		id: string
		status: "error" | "idle" | "running" | "closed"
		lastError?: string
		archivedAt?: string | null
	}>
) {
	const sent: string[] = []
	const byId = new Map(agents.map((a) => [a.id, { ...a }]))

	const paseo = {
		agents: {
			async list() {
				return {
					entries: [...byId.values()].filter((a) => a.status === "error").map((a) => ({ agent: a }))
				}
			},
			ref(id: string) {
				return {
					get lastError() {
						return byId.get(id)?.lastError ?? null
					},
					get status() {
						return byId.get(id)?.status ?? null
					},
					get archivedAt() {
						return byId.get(id)?.archivedAt ?? null
					},
					async refresh() {
						return byId.has(id) ? { id } : null
					},
					async send(text: string) {
						sent.push(`${id}:${text}`)
					}
				}
			}
		}
	} as unknown as PaseoApi

	return { paseo, sent }
}

const settings = {
	enabled: true,
	dryRun: false,
	intervalMinutes: 15,
	maxAttempts: 48,
	continuePrompt: DEFAULT_CONTINUE_PROMPT
}

describe("resume path", () => {
	it("scan queues limit errors and resume sends continue prompt", async () => {
		const { paseo, sent } = mockPaseo([
			{ id: "a1", status: "error", lastError: "rate limit exceeded" },
			{ id: "a2", status: "error", lastError: "unrelated boom" }
		])
		const queue = createQueue()

		await scanErrorAgents(paseo, queue, settings)
		assert.equal(queue.has("a1"), true)
		assert.equal(queue.has("a2"), false)

		queue.defer("a1", 0)
		await resumeDueAgents(paseo, queue, settings)
		assert.equal(sent.length, 1)
		assert.match(sent[0]!, /^a1:/)
		assert.equal(queue.get("a1")?.attempts, 1)
	})

	it("dryRun logs path without send", async () => {
		const { paseo, sent } = mockPaseo([{ id: "a1", status: "idle", lastError: "out of credits" }])
		const queue = createQueue()
		queue.enqueue("a1", "out of credits", 0)
		await resumeDueAgents(paseo, queue, { ...settings, dryRun: true })
		assert.equal(sent.length, 0)
		assert.equal(queue.get("a1")?.attempts, 1)
	})
})
