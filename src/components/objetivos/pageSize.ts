/**
 * How many rows a list page can hold.
 *
 * The default sits high enough to fill a laptop screen — a short table leaves an
 * odd band of empty card below it — and the larger steps exist because how much
 * actually fits is a property of the viewer's screen, which no single fixed
 * number gets right for everyone.
 */
export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 20;
