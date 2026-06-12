# Broadcast full game state, including private hands, to all guests

The host broadcasts the entire game state — including every player's private hole cards — to all connected guests, rather than sending each guest a redacted view. This was chosen over a redacted-view approach because it makes host migration (when the host leaves mid-hand, the first guest becomes host) seamless: the new host already has everything needed to continue the hand without voiding it.

The trade-off is that a technically-savvy guest could inspect network traffic or app state to see other players' cards. This is accepted because the game is casual, played among trusted people on the same wifi, with no real money involved.
