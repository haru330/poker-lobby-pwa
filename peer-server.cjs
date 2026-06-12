// Local PeerJS signaling server for offline/hotspot play (no internet
// available, so the public 0.peerjs.com broker is unreachable).
// Run alongside `npm run dev`. See docs/adr/0004-local-peerjs-server-for-offline-play.md.
const { PeerServer } = require('peer');

const PORT = 9000;

PeerServer({ port: PORT, path: '/' }, () => {
  console.log(`PeerServer running on port ${PORT}`);
});
