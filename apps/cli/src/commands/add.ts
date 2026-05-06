import { intro, outro, log, spinner } from '@clack/prompts';
import * as path from 'node:path';
import { fetchRaw, listPackageFiles, UnknownPackageError } from '../lib/github.js';
import { resolveConflict } from '../lib/conflicts.js';
import { pathExists, writeFileEnsuringDir } from '../lib/writer.js';
import type { AddOptions, ConflictMode } from '../types.js';

export async function runAdd(pkg: string, folder: string | undefined, opts: AddOptions): Promise<void> {
	if (opts.yes && opts.skipExisting) {
		throw new Error('`--yes` and `--skip-existing` are mutually exclusive.');
	}

	intro(`Adding @foundation/${pkg}`);

	const s = spinner();
	s.start(`Listing files from ${opts.repo}@${opts.ref}`);
	let files: string[];
	try {
		files = await listPackageFiles(opts.repo, opts.ref, pkg);
	} catch (err) {
		s.stop('Failed to list files.');
		throw err;
	}
	s.stop(`Found ${files.length} file${files.length === 1 ? '' : 's'}.`);

	const destRoot = path.resolve(opts.cwd, folder ?? pkg);
	const mode: ConflictMode = opts.yes ? 'overwrite' : opts.skipExisting ? 'skip' : 'ask';
	const prefix = `packages/${pkg}/`;

	let written = 0;
	let skipped = 0;

	for (const repoPath of files) {
		const rel = repoPath.slice(prefix.length);
		const dest = path.join(destRoot, rel);

		if (await pathExists(dest)) {
			const decision = await resolveConflict(dest, mode, opts.cwd);
			if (decision === 'skip') {
				log.info(`skip  ${path.relative(opts.cwd, dest)}`);
				skipped++;
				continue;
			}
		}

		const contents = await fetchRaw(opts.repo, opts.ref, repoPath);
		await writeFileEnsuringDir(dest, contents);
		log.success(`wrote ${path.relative(opts.cwd, dest)}`);
		written++;
	}

	outro(`Done. ${written} written, ${skipped} skipped.`);
}

export { UnknownPackageError };
