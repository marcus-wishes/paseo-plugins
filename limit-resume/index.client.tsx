import type { PluginClientContext } from "@getpaseo/plugin/client"
import { LimitResumeSettings } from "./client/settings"

export default function contribute(client: PluginClientContext) {
	client.addSettingsScreen({
		id: "limit-resume",
		title: "Limit resume",
		icon: "RotateCcw",
		Component: LimitResumeSettings
	})
	client.addCommandCenterItem({
		id: "limit-resume-settings",
		title: "Configure limit resume",
		icon: "RotateCcw",
		context: "global",
		onSelect({ openSettings }) {
			openSettings("limit-resume")
		}
	})
	return () => {}
}
