import type { PaseoApi } from "@getpaseo/client"
import type { PluginSettings } from "@getpaseo/plugin/server"
import type { preferences } from "../shared/settings"
import type { LimitResumeQueue } from "./queue"
import { resumeDueAgents, scanErrorAgents } from "./resume"

type SettingsHandle = PluginSettings<typeof preferences.schema>

let ticking = false

export async function tick(paseo: PaseoApi, settings: SettingsHandle, queue: LimitResumeQueue): Promise<void> {
	if (ticking) return
	ticking = true
	try {
		const current = await settings.read()
		if (current.status !== "ready" || !current.values.enabled) return

		await scanErrorAgents(paseo, queue, current.values)
		await resumeDueAgents(paseo, queue, current.values)
	} catch (error) {
		console.error("[limit-resume] tick_failed", error)
	} finally {
		ticking = false
	}
}
