// The cover's frame, on its own so pages can lay a cover out without loading the code that draws one.

/** The cover's frame in CSS pixels (3:2), drawn at the screen's pixel ratio. */
export const COVER_SIZE = { width: 400, height: 267 }
/**
 * Extra canvas around the frame, so treetops and land reaching past it are drawn rather than cut
 * off; the page lets the image overflow the frame by the same amount.
 */
export const COVER_BLEED = 48
