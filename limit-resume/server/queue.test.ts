import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createQueue } from "./queue"

describe("createQueue", () => {
	it("enqueues once and updates reason on repeat", () => {
		const queue = createQueue()
		queue.enqueue("a1", "first", 100)
		queue.enqueue("a1", "second", 999)
		const entry = queue.get("a1")
		assert.equal(entry?.reason, "second")
		assert.equal(entry?.nextAttemptAt, 100)
		assert.equal(queue.size(), 1)
	})

	it("returns due entries under concurrency", () => {
		const queue = createQueue()
		queue.enqueue("a1", "r", 10)
		queue.enqueue("a2", "r", 20)
		queue.enqueue("a3", "r", 30)
		assert.deepEqual(
			queue.due(25, 1).map((e) => e.agentId),
			["a1"]
		)
		assert.deepEqual(
			queue.due(25, 2).map((e) => e.agentId),
			["a1", "a2"]
		)
	})

	it("markAttempt increments and defer does not", () => {
		const queue = createQueue()
		queue.enqueue("a1", "r", 0)
		queue.markAttempt("a1", 50)
		assert.equal(queue.get("a1")?.attempts, 1)
		assert.equal(queue.get("a1")?.nextAttemptAt, 50)
		queue.defer("a1", 80)
		assert.equal(queue.get("a1")?.attempts, 1)
		assert.equal(queue.get("a1")?.nextAttemptAt, 80)
	})
})
