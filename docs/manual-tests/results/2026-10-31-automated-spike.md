# Technical spike evidence — 2026-10-31

## Automated and local-browser evidence

- TypeScript typecheck across all five workspaces: PASS
- Unit/integration/component tests: PASS — 63 tests in 20 files
- Production web build: PASS
- Dependency audit: PASS — 0 known vulnerabilities
- WebSocket geometry synchronization to separate panel/output clients: PASS
  (automated integration)
- Panel receives the authoritative post-command snapshot: PASS
- Revoked local state survives server restart and restores fail-closed: PASS
  (automated persistence contract; remote VDO behavior remains manual)
- Corrupt persisted state aborts recovery instead of recreating an active
  invite; stale temporary files do not block a new atomic save: PASS
- Stale revision rejection: PASS (automated)
- Output capability mutation rejection: PASS (automated)
- Revoked output access closes connected output WebSockets and denies HTTP/new
  WebSocket reads while publication state remains separate: PASS (automated)
- Output media renders only with a connected, authenticated `ACTIVE` snapshot;
  forbidden/revoked output mounts no VDO iframe in either strategy: PASS
- Invite token hashes omitted from snapshots: PASS (automated)
- Guest iframe allowlist excludes `microphone`: PASS (automated DOM contract)
- Sender URL contains `audiodevice=0`: PASS (automated URL contract)
- Viewer URL contains `noaudio` and `cleanoutput`: PASS (automated URL contract)
- HTML/body/root/output computed background transparent: PASS in headless Chromium
- 1920×1080 output canvas scale: exactly 1 in headless Chromium
- Camera media DOM node remains mounted across geometry changes: PASS
  (component contract; real WebRTC continuity remains manual)
- Camera media DOM node remains mounted across hide/show: PASS
- Browser client reconnects with a fresh hello/snapshot and does not replay an
  unconfirmed command: PASS (component contract)
- Concurrent panel mutations are locally serialized until the authoritative
  snapshot; typed rejections are surfaced: PASS
- Individual-viewer and native-scene receiver URL paths: PASS (DOM/URL contract)
- Control and guest layouts: visually inspected; no horizontal overflow
- Browser console after cleanup: 0 errors, 0 warnings

These results do **not** prove physical camera transport, an audio track count of
zero, OBS alpha compositing, VDO director ownership, transfer secrecy, remote
disconnect, or direct-destination blocking.

The direct guest route is a disposable VDO harness, not an enforced local
invite/admission boundary. Its richer denied/busy/disconnected lifecycle and the
director adapter remain unimplemented. This blocks revocation Gate B; it is not
an automatic failure claim about VDO.Ninja itself.

## Manual evidence

Status: **MANUAL PENDING**

- Real physical camera: NOT RUN
- OBS Browser Source: NOT RUN
- OBS transparency over game capture: NOT RUN
- Audio meters/tracks: NOT RUN
- Connected participant revocation: NOT RUN
- Revoked invite reconnect: NOT RUN
- Previously obtained destination attempt: NOT RUN
- Director disconnect/reclaim behavior: NOT RUN
- Local server restart: NOT RUN
- Authorized reconnect preserving slot: NOT RUN

Gate B remains blocked on the manual evidence above. No full composition editor
should be built from this document alone.

