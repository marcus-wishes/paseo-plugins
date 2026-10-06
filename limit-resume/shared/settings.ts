import { defineSettings } from "@getpaseo/plugin"
import { z } from "zod"

export const DEFAULT_CONTINUE_PROMPT =
	"Continue the unfinished task from where you left off. Do not restart from scratch."

export const preferences = defineSettings({
	id: "limit-resume",
	scope: "host",
	version: 1,
	schema: z.object({
		enabled: z.boolean().default(true),
		dryRun: z.boolean().default(true),
		intervalMinutes: z
			.number()
			.int()
			.min(1)
			.max(24 * 60)
			.default(15),
		maxAttempts: z.number().int().min(1).max(1000).default(48),
		continuePrompt: z.string().trim().min(1).max(2000).default(DEFAULT_CONTINUE_PROMPT)
	})
})

export type LimitResumeSettings = z.output<typeof preferences.schema>
