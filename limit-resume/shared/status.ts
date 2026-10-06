import { defineRpc } from "@getpaseo/plugin"
import { z } from "zod"

export const statusRpc = defineRpc({
	name: "status",
	input: z.object({}),
	output: z.object({
		queueSize: z.number().int(),
		queued: z.array(
			z.object({
				agentId: z.string(),
				reason: z.string(),
				attempts: z.number().int(),
				nextAttemptAt: z.number()
			})
		)
	})
})
