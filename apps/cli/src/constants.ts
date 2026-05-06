export const DEFAULT_REF = 'main';

/**
 * Parse `owner/repo` out of a package.json `repository` field.
 *
 * Accepts either the shorthand string form or the object form `{ url: "..." }`.
 * Supports common URL shapes:
 *   - https://github.com/owner/repo(.git)
 *   - git+https://github.com/owner/repo.git
 *   - git@github.com:owner/repo.git
 *   - github:owner/repo
 *   - owner/repo
 *
 * Returns undefined if no recognizable owner/repo pair is found.
 */
export function repoFromPackageJson(repository: string | { url?: string } | undefined): string | undefined {
	const raw = typeof repository === 'string' ? repository : repository?.url;
	if (!raw) return undefined;

	const stripped = raw
		.replace(/^git\+/, '')
		.replace(/\.git$/, '')
		.replace(/^github:/, '');

	// SSH form: git@github.com:owner/repo
	const ssh = /^git@github\.com:([^/]+)\/([^/]+)$/.exec(stripped);
	if (ssh) return `${ssh[1]}/${ssh[2]}`;

	// HTTPS form: https://github.com/owner/repo
	const https = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/.exec(stripped);
	if (https) return `${https[1]}/${https[2]}`;

	// Shorthand: owner/repo
	const short = /^([^/\s]+)\/([^/\s]+)$/.exec(stripped);
	if (short) return `${short[1]}/${short[2]}`;

	return undefined;
}
