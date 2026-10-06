import { useCallback, useEffect, useMemo, useState } from "react"
import { Text, View } from "react-native"
import { useRpc, useSettings, type PluginSurfaceProps, type SettingsState } from "@getpaseo/plugin/client"
import {
	SettingsAction,
	SettingsCard,
	SettingsInput,
	SettingsSection,
	SettingsSwitch
} from "@getpaseo/plugin/client/ui"
import { preferences } from "../shared/settings"
import { statusRpc } from "../shared/status"

type Ready = Extract<SettingsState<typeof preferences.schema>, { status: "ready" }>

function Controls({ settings, theme }: { settings: Ready; theme: PluginSurfaceProps["theme"] }) {
	const style = useMemo(() => ({ color: theme.colors.foreground }), [theme])
	const muted = useMemo(() => ({ color: theme.colors.foregroundMuted }), [theme])
	const [promptDraft, setPromptDraft] = useState(settings.values.continuePrompt)
	const [intervalDraft, setIntervalDraft] = useState(String(settings.values.intervalMinutes))
	const [maxDraft, setMaxDraft] = useState(String(settings.values.maxAttempts))
	const status = useRpc(statusRpc)

	useEffect(() => {
		void status({})
		// Bootstrap daemon session / timer once when settings open.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only
	}, [])

	const saveToggle = useCallback(
		(patch: Partial<Ready["values"]>) => {
			void settings.save({ ...settings.values, ...patch }, settings.revision)
		},
		[settings]
	)

	const saveNumbersAndPrompt = useCallback(async () => {
		const intervalMinutes = Number.parseInt(intervalDraft, 10)
		const maxAttempts = Number.parseInt(maxDraft, 10)
		if (!Number.isFinite(intervalMinutes) || !Number.isFinite(maxAttempts)) return
		await settings.save(
			{
				...settings.values,
				intervalMinutes,
				maxAttempts,
				continuePrompt: promptDraft.trim() || settings.values.continuePrompt
			},
			settings.revision
		)
	}, [settings, intervalDraft, maxDraft, promptDraft])

	return (
		<SettingsSection title="Limit resume">
			<SettingsCard>
				<SettingsSwitch
					label="Enabled"
					hint="Watch for provider limit failures and retry later"
					value={settings.values.enabled}
					disabled={settings.saving}
					onValueChange={(enabled) => saveToggle({ enabled })}
				/>
				<SettingsSwitch
					label="Dry run"
					hint="Log resumes without sending a continue prompt"
					value={settings.values.dryRun}
					disabled={settings.saving}
					onValueChange={(dryRun) => saveToggle({ dryRun })}
				/>
			</SettingsCard>
			<SettingsCard>
				<SettingsInput
					label="Interval (minutes)"
					initialValue={intervalDraft}
					onChangeText={setIntervalDraft}
					disabled={settings.saving}
				/>
				<SettingsInput
					label="Max attempts"
					initialValue={maxDraft}
					onChangeText={setMaxDraft}
					disabled={settings.saving}
				/>
				<SettingsInput
					label="Continue prompt"
					initialValue={promptDraft}
					onChangeText={setPromptDraft}
					disabled={settings.saving}
				/>
				<SettingsAction
					label="Save interval, attempts, and prompt"
					actionLabel="Save"
					disabled={settings.saving}
					onPress={() => void saveNumbersAndPrompt()}
				/>
			</SettingsCard>
			{settings.saveError ? (
				<Text accessibilityRole="alert" style={style}>
					{settings.saveError}
				</Text>
			) : null}
			<Text style={muted}>dryRun defaults on. Check daemon logs with: paseo plugin logs limit-resume</Text>
		</SettingsSection>
	)
}

export function LimitResumeSettings({ theme }: PluginSurfaceProps) {
	const settings = useSettings(preferences)
	const style = useMemo(() => ({ color: theme.colors.foreground }), [theme])

	if (settings.status === "loading") {
		return <Text style={style}>Loading settings…</Text>
	}
	if (settings.status !== "ready") {
		return (
			<View>
				<Text style={style}>{settings.error}</Text>
				{settings.status === "invalid" ? (
					<SettingsAction label="Reset settings" actionLabel="Reset" onPress={() => void settings.reset()} />
				) : null}
			</View>
		)
	}
	return <Controls settings={settings} theme={theme} />
}
