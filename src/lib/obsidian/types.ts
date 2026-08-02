/** Raw response shapes returned by the Obsidian Local REST API upstream. */

export interface ObsidianDirectoryListing {
  files: string[];
}

export interface ObsidianSearchMatch {
  context: string;
  match: { start: number; end: number };
}

export interface ObsidianSearchSimpleResult {
  filename: string;
  score: number;
  matches: ObsidianSearchMatch[];
}

export interface ObsidianErrorResponse {
  errorCode: number;
  message: string;
}
