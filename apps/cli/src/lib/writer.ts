import { mkdir, writeFile, access } from 'node:fs/promises';
import * as path from 'node:path';

export async function pathExists(p: string): Promise<boolean> {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}

export async function writeFileEnsuringDir(absPath: string, contents: string): Promise<void> {
	await mkdir(path.dirname(absPath), { recursive: true });
	await writeFile(absPath, contents, 'utf8');
}
