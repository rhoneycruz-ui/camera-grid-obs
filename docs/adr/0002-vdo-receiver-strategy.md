# ADR 0002: VDO receiver strategy

- Status: Proposed — Gate B manual evidence pending
- Date: 2026-10-31

## Candidates

1. One individual `view` iframe per participant, positioned by the local layout.
2. One native VDO.Ninja `scene` iframe controlled through the director API.

The technical slice exposes both candidates through the output URL:
`receiver=individual` and `receiver=scene`. Candidate 1 gives the local
application direct CSS control and preserves each iframe while geometry or
visibility changes. It may consume more participant upload, CPU, and peer
connections than a native scene. Candidate 2 delegates composition to VDO and
cannot prove the same local per-frame control. No final choice is made until
Windows/OBS measurements with one and two real cameras are recorded.

## Gate B evidence required

- real camera appears in OBS;
- no audio track/meter from VDO.Ninja;
- alpha background composites correctly;
- layout changes do not reload the iframe/WebRTC connection;
- connection count, CPU, bandwidth, and reconnect behavior are acceptable;
- revocation/direct-access limitations are recorded without stronger claims.
