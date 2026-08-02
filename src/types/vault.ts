/** Shapes shared between our own API routes (/api/*) and the frontend. */

export interface TreeEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface FileContent {
  path: string;
  content: string;
}

export interface SearchMatch {
  context: string;
  start: number;
  end: number;
}

export interface SearchResultItem {
  path: string;
  score: number;
  matches: SearchMatch[];
}

export interface StatusResult {
  ok: boolean;
}
