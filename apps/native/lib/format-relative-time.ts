const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	["year", 1000 * 60 * 60 * 24 * 365],
	["month", 1000 * 60 * 60 * 24 * 30],
	["day", 1000 * 60 * 60 * 24],
	["hour", 1000 * 60 * 60],
	["minute", 1000 * 60],
];

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
	style: "narrow",
});

export function formatRelativeTime(date: Date): string {
	const diffMs = date.getTime() - Date.now();

	for (const [unit, ms] of UNITS) {
		const diff = diffMs / ms;
		if (Math.abs(diff) >= 1) {
			return relativeTimeFormat.format(Math.round(diff), unit);
		}
	}

	return "now";
}
