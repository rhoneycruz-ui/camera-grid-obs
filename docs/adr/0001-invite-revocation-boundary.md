# ADR 0001: Invite revocation boundary

- Status: Proposed — blocked on Gate A
- Date: 2026-10-30
- Security priority: high

## Context

An invitation is an authorization to reach the production camera grid. The
product must distinguish access control from layout presentation.

- **Hidden:** the participant remains authorized and may remain connected; only
  their camera is not rendered in the active layout. Restoring visibility is a
  layout action.
- **Revoked:** the participant is no longer authorized to enter or re-enter the
  production room. Removing the visible camera alone is not revocation.

VDO.Ninja does not document durable, individual revocation of a direct invite
URL after that URL has been revealed.

## Option A — VDO.Ninja lobby and transfer (recommended for the spike)

Each invitation opens a landing/lobby room. The director screens the guest and
transfers an approved connection into a secret production room. A transferred
guest does not learn the production destination. Refreshing or reconnecting
returns the guest to the lobby.

Revocation means:

1. remove/transfer any current production connection;
2. mark the local invite generation `REVOKED`;
3. never transfer that generation into production again;
4. a fresh browser or reconnect may reach the lobby, but never production.

Benefits: no mandatory paid service, no public application backend, and the
production room remains undisclosed. Cost: the revoked link still establishes a
VDO.Ninja lobby connection and admission requires director action.

## Option B — minimal public token broker

The public guest page calls an HTTPS, non-video endpoint. The broker stores only
hashed invitation tokens and checks expiry/revocation before returning the next
admission step.

Benefits: a revoked application link can fail before the guest page obtains
admission. Costs: public backend, operational security, persistence, abuse
protection, and more maintenance. If a reusable direct production URL was ever
returned to the browser, revoking the broker token alone cannot make that URL
unknown again; lobby/transfer or room rotation is still required.

## Proposed decision

Use Option A for the technical spike because it protects the production room
with the smallest public attack surface and lowest operating cost. This decision
is not accepted until the owner confirms that “revoked users may reach the lobby
but can never enter/re-enter production” satisfies the requirement.

No invite domain, server, or full panel implementation may proceed before Gate A
is accepted and this ADR changes to `Accepted`.
