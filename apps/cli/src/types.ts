export interface AddOptions {
	repo: string;
	ref: string;
	cwd: string;
	yes: boolean;
	skipExisting: boolean;
}

export type ConflictMode = 'ask' | 'overwrite' | 'skip';

export interface TreeEntry {
	path: string;
	type: 'blob' | 'tree' | 'commit';
	sha: string;
	mode: string;
	size?: number;
	url?: string;
}

export interface TreeResponse {
	sha: string;
	url: string;
	tree: TreeEntry[];
	truncated: boolean;
}
