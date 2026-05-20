#!/usr/bin/env node
import { Command } from 'commander';
import { cancel } from '@clack/prompts';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { runAdd } from './commands/add.js';
import { DEFAULT_REF, repoFromPackageJson } from './constants.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgJson = JSON.parse(readFileSync(path.join(here, '..', 'package.json'), 'utf8')) as {
	version: string;
	repository?: string | { url?: string };
};

const defaultRepo = repoFromPackageJson(pkgJson.repository);

const program = new Command();

program
	.name('foundation')
	.description('Copy foundation package source into your project.')
	.version(pkgJson.version);

program
	.command('add')
	.argument('<pkg>', 'Bare package name (e.g. `base` for packages/base).')
	.argument('[folder]', 'Destination folder name (defaults to <pkg>).')
	.option('--repo <owner/name>', 'GitHub repo to pull from.', defaultRepo)
	.option('--ref <ref>', 'Branch, tag, or commit SHA.', DEFAULT_REF)
	.option('--cwd <path>', 'Working directory.', process.cwd())
	.option('-y, --yes', 'Overwrite all conflicting files without prompting.', false)
	.option('--skip-existing', 'Skip all conflicting files without prompting.', false)
	.action(async (pkg: string, folder: string | undefined, raw: Record<string, unknown>) => {
		try {
			await runAdd(pkg, folder, {
				repo: String(raw.repo),
				ref: String(raw.ref),
				cwd: String(raw.cwd),
				yes: Boolean(raw.yes),
				skipExisting: Boolean(raw.skipExisting)
			});
		} catch (err) {
			cancel(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	});

program.parseAsync(process.argv).catch((err: unknown) => {
	cancel(err instanceof Error ? err.message : String(err));
	process.exit(1);
});
