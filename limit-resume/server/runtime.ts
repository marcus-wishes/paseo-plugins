import type { PaseoApi } from "@getpaseo/client"
import type { PluginSettings } from "@getpaseo/plugin/server"
import type { preferences } from "../shared/settings"
import type { LimitResumeQueue } from "./queue"
import { tick } from "./tick"

type SettingsHandle = PluginSettings<typeof preferences.schema>

const TICK_MS = 60_000

export function createRuntime(settings: SettingsHandle, queue: LimitResumeQueue) {
	let paseo: PaseoApi | null = null
	let timer: ReturnType<typeof setInterval> | null = null

	const runTick = () => {
		if (!paseo) return
		void tick(paseo, settings, queue)
	}

	return {
		bindPaseo(next: PaseoApi): void {
			paseo = next
			if (!timer) {
				timer = setInterval(runTick, TICK_MS)
				runTick()
			}
		},

		dispose(): void {
			if (timer) clearInterval(timer)
			timer = null
			paseo = null
		},

		queue
	}
}

export type LimitResumeRuntime = ReturnType<typeof createRuntime>
