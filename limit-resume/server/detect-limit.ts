import type { AgentTimelineItem } from "@getpaseo/protocol/agent-types"
import type { PluginTurnOutcome } from "@getpaseo/plugin/server"
import { matchesLimitText } from "../shared/limit-patterns"
import { latestOutputText } from "./inspect"

export function isLimitFailure(outcome: PluginTurnOutcome, timeline: readonly AgentTimelineItem[]): boolean {
	if (outcome.kind === "canceled") return false
	if (outcome.kind === "failed" && matchesLimitText(outcome.error.message)) {
		return true
	}
	if (outcome.kind === "failed" && matchesLimitText(outcome.error.code)) {
		return true
	}
	return matchesLimitText(latestOutputText(timeline))
}

export function isLimitErrorMessage(message: string | null | undefined): boolean {
	return matchesLimitText(message)
}
