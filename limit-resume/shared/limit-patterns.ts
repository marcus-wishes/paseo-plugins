/** Case-insensitive matchers for provider usage / rate-limit failures. */
export const LIMIT_PATTERN =
	/out of credits|credit balance|usage limit|rate limit|too many requests|quota|capacity|you've hit|overloaded|billing|spend limit|try again later|\b429\b/i

export function matchesLimitText(text: string | null | undefined): boolean {
	if (!text) return false
	return LIMIT_PATTERN.test(text)
}
