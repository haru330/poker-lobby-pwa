# Algorithmic hand evaluator instead of a precomputed lookup table

Hand evaluation (best-5-of-7, with full tiebreak ordering for splitting pots) is computed algorithmically at runtime — bitmask-based rank/suit counting — rather than via a precomputed perfect-hash lookup table (the common "two-plus-two" approach, ~130MB for 7-card hands).

At this scale (one evaluation per player per street, not millions per second), an algorithmic evaluator is fast enough, and avoids shipping a multi-hundred-MB table in a PWA bundle. "Precomputing" instead happens per-hand: each player's hand category and contributing cards are computed and cached as soon as the relevant community cards are revealed, not recomputed on every render.
