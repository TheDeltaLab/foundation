import type { TreeResponse } from '../types.js';

export class UnknownPackageError extends Error {
	constructor(pkg: string) {
		super(`Unknown package \`@foundation/${pkg}\` — no \`packages/${pkg}/package.json\` found in the repo.`);
		this.name = 'UnknownPackageError';
	}
}

function apiHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': '@foundation/cli'
	};
	const token = process.env.GITHUB_TOKEN;
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

/**
 * Single Trees API call to enumerate the repo, then filter to
 * `packages/<pkg>/(package.json|tsconfig.json|src/**)`.
 */
export async function listPackageFiles(repo: string, ref: string, pkg: string): Promise<string[]> {
	const url = `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
	const res = await fetch(url, { headers: apiHeaders() });
	if (res.status === 404) {
		throw new Error(`Repo or ref not found: ${repo}@${ref} (${url})`);
	}
	if (res.status === 403) {
		throw new Error(`GitHub API rate-limited or forbidden (${res.status}). Set GITHUB_TOKEN to lift the 60-req/hr anonymous limit.`);
	}
	if (!res.ok) {
		throw new Error(`GitHub API ${res.status} ${res.statusText} for ${url}`);
	}

	const body = (await res.json()) as TreeResponse;
	if (body.truncated) {
		throw new Error('GitHub Trees API returned a truncated response. The repo is too large for a single recursive call; please file an issue.');
	}

	const prefix = `packages/${pkg}/`;
	const keep = (p: string): boolean =>
		p === `${prefix}package.json` ||
		p === `${prefix}tsconfig.json` ||
		p.startsWith(`${prefix}src/`);

	const files = body.tree
		.filter((e) => e.type === 'blob' && keep(e.path))
		.map((e) => e.path);

	if (!files.includes(`${prefix}package.json`)) {
		throw new UnknownPackageError(pkg);
	}

	return files;
}

export async function fetchRaw(repo: string, ref: string, path: string): Promise<string> {
	const url = `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(ref)}/${path}`;
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
	}
	return res.text();
}
