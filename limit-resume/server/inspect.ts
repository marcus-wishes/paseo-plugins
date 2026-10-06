import type { AgentTimelineItem } from "@getpaseo/protocol/agent-types"

/** Join text after the latest user message (from Paseo lifecycle-actions example). */
export function latestOutputText(timeline: readonly AgentTimelineItem[]): string {
	let output = ""
	for (const item of timeline) {
		if (item.type === "user_message") {
			output = ""
		} else if ("text" in item && typeof item.text === "string") {
			output += item.text
		} else {
			output += JSON.stringify(item) + "\n"
		}
	}
	return output
}
