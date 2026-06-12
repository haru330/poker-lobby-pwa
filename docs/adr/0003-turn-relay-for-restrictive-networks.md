# TURN relay fallback instead of an audio-based transport

On restrictive networks (e.g. eduroam, train/restaurant wifi), the PeerJS public
broker (signaling, over HTTPS/WSS) is usually reachable, but the actual WebRTC
data channel often fails to establish — both peers sit behind NATs/firewalls
that block direct peer-to-peer UDP, and there's no relay to fall back to.

We considered transmitting game state over ultrasonic audio (mic/speaker) or
through a VoIP "softphone" data channel, since both only require generic
internet/audio access. Rejected: these channels realistically carry tens to
low-hundreds of bits/sec in noisy environments, while this app broadcasts full
JSON state snapshots (all players, hands, pots, action log) on every action —
multiple kilobytes per message. Not viable at any reasonable latency.

Instead, `Peer` is configured with a TURN server (in addition to STUN) so
PeerJS can relay the WebRTC data channel over standard ports (443) when direct
P2P isn't possible. This keeps the existing architecture and message protocol
unchanged — it only affects how the underlying connection is established.

The TURN server used (`openrelay.metered.ca`) is a free, publicly-documented
shared relay with hardcoded credentials — fine for this casual, no-stakes app,
but it's third-party infrastructure outside our control (rate limits, uptime,
or shutdown are possible). If reliability becomes an issue, the fix is to swap
in our own TURN server (e.g. self-hosted coturn) by changing `PEER_CONFIG` in
`NetworkProvider.tsx` — no other code changes needed.
