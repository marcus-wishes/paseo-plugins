import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { matchesLimitText } from "./limit-patterns"

describe("matchesLimitText", () => {
	it("matches common provider limit copy", () => {
		assert.equal(matchesLimitText("You're out of credits"), true)
		assert.equal(matchesLimitText("rate limit exceeded"), true)
		assert.equal(matchesLimitText("HTTP 429 from upstream"), true)
		assert.equal(matchesLimitText("weekly usage limit reached"), true)
	})

	it("rejects unrelated text", () => {
		assert.equal(matchesLimitText("All tests passed"), false)
		assert.equal(matchesLimitText(""), false)
		assert.equal(matchesLimitText(null), false)
	})
})
