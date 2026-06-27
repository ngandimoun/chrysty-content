export type SearchScope =
  | "title"
  | "transcript"
  | "story"
  | "podcast"
  | "tags"
  | "topics";

export interface SearchState {
  query: string;
  scopes: SearchScope[];
}

export const DEFAULT_SEARCH_STATE: SearchState = {
  query: "",
  scopes: ["title"],
};
