import { isCancel, select, cancel } from '@clack/prompts';
import * as path from 'node:path';
import type { ConflictMode } from '../types.js';

export type Resolution = 'write' | 'skip';

export async function resolveConflict(absDest: string, mode: ConflictMode, cwd: string): Promise<Resolution> {
	if (mode === 'overwrite') return 'write';
	if (mode === 'skip') return 'skip';

	const rel = path.relative(cwd, absDest) || absDest;
	const choice = await select({
		message: `File exists: ${rel}`,
		options: [
			{ value: 'skip', label: 'Skip' },
			{ value: 'overwrite', label: 'Overwrite' }
		]
	});

	if (isCancel(choice)) {
		cancel('Aborted by user.');
		process.exit(1);
	}

	return choice === 'overwrite' ? 'write' : 'skip';
}
