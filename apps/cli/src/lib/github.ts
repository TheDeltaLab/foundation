import type { TreeResponse } from '../types.js';

export class UnknownPackageError extends Error {
	constructor(pkg: string) {
		super(`Unknown package \`${pkg}\` — no \`packages/${pkg}/package.json\` found in the repo.`);
		this.name = 'UnknownPackageError';
	}
}

function apiHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': '@delta-ai/foundation'
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
	// Copy everything inside packages/<pkg>/ except generated output,
	// dependency directories, and caches. Matches shadcn-style "adopt the
	// source" semantics rather than a curated whitelist.
	const EXCLUDE_SEGMENTS = new Set([
		'node_modules',
		'dist',
		'build',
		'coverage',
		'.turbo',
		'.next',
		'.cache'
	]);
	const keep = (p: string): boolean => {
		if (!p.startsWith(prefix)) return false;
		const rel = p.slice(prefix.length);
		if (!rel) return false;
		const segments = rel.split('/');
		return !segments.some((s) => EXCLUDE_SEGMENTS.has(s));
	};

	const files = body.tree
		.filter((e) => e.type === 'blob' && keep(e.path))
		.map((e) => e.path);

	if (!files.includes(`${prefix}package.json`)) {
		throw new UnknownPackageError(pkg);
	}

	return files;
}

export async function fetchRaw(repo: string, ref: string, path: string): Promise<string> {
	// raw.githubusercontent.com expects the ref unencoded (e.g. `feat/x`,
	// not `feat%2Fx`) and path segments encoded individually to preserve `/`.
	const encodedPath = path.split('/').map(encodeURIComponent).join('/');
	const url = `https://raw.githubusercontent.com/${repo}/${ref}/${encodedPath}`;
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
	}
	return res.text();
}
