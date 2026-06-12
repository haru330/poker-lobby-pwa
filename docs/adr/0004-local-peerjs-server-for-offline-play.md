# Local PeerJS signaling server for offline hotspot play

Eduroam-style networks isolate clients from each other even on the same
account/SSID, so a tunnel (ADR 0003's TURN relay still requires internet for
signaling via `0.peerjs.com`) doesn't help when there's genuinely no internet
access at all.

For fully offline play, one device's phone runs a personal hotspot (wifi AP,
no SIM data needed) and the laptop running `npm run dev:offline` joins it as a
client, getting a local IP (e.g. `172.20.10.2`). Other phones join the same
hotspot and load the app from that IP.

This still leaves PeerJS's signaling broker unreachable (`0.peerjs.com` needs
internet). We run a local `PeerServer` (the `peer` npm package) alongside Vite
on port 9000. In dev mode, `NetworkProvider.tsx` points `new Peer(...)` at
`window.location.hostname:9000` — the same host the page was loaded from —
instead of the public broker. Once signaling has connected peers, the actual
WebRTC data channels are direct peer-to-peer over the hotspot LAN (no TURN
needed, same subnet).

In production (e.g. deployed to Vercel), `import.meta.env.DEV` is false, so
`PEER_CONFIG` omits the local `host`/`port` and PeerJS falls back to its
default public broker — appropriate there since a deployed PWA implies the
players have real internet access, and any phone could "be the host."

This means dev/offline and production use *different* signaling paths. If
that divergence becomes a problem (e.g. testing production-like signaling
locally), the local PeerServer could be hosted publicly instead and used in
both modes — but for now the simpler dual-mode config is preferred.
