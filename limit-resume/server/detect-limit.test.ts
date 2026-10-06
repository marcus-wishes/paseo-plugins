import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { AgentTimelineItem } from "@getpaseo/protocol/agent-types"
import { isLimitFailure } from "./detect-limit"

describe("isLimitFailure", () => {
	it("detects failed outcomes with limit messages", () => {
		assert.equal(isLimitFailure({ kind: "failed", error: { message: "rate limit hit" } }, []), true)
	})

	it("ignores canceled turns", () => {
		assert.equal(
			isLimitFailure({ kind: "canceled", reason: "user" }, [
				{ type: "assistant_message", text: "out of credits" } as AgentTimelineItem
			]),
			false
		)
	})

	it("detects limit text in timeline after last user message", () => {
		const timeline = [
			{ type: "user_message", text: "keep going" },
			{ type: "assistant_message", text: "You've hit your usage limit" }
		] as AgentTimelineItem[]
		assert.equal(isLimitFailure({ kind: "completed" }, timeline), true)
	})

	it("clears prior text on a new user message", () => {
		const timeline = [
			{ type: "assistant_message", text: "out of credits" },
			{ type: "user_message", text: "retry" },
			{ type: "assistant_message", text: "done" }
		] as AgentTimelineItem[]
		assert.equal(isLimitFailure({ kind: "completed" }, timeline), false)
	})
})
