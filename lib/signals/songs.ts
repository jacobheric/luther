import { type Track } from "@spotify/web-api-ts-sdk";
import { signal } from "@preact/signals";

export const SONGS = signal<Track[]>([]);
export const ERROR = signal<string | null>(null);
