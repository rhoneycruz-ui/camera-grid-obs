# ADR 0001: Invite revocation boundary

- Status: Accepted with documented limitations
- Date: 2026-10-30
- Security priority: high

## Context

An invitation is an authorization to reach the production camera grid. The
product must distinguish access control from layout presentation.

- **Hidden:** the participant remains authorized and may remain connected; only
  their camera is not rendered in the active layout. Restoring visibility is a
  layout action.
- **Revoked:** the local control rejects that invite generation, removes its
  camera from the production layout, requests disconnection of its publication,
  and forbids new local approvals. Removing the visible camera alone is not
  revocation.

VDO.Ninja does not document durable, individual revocation of a direct invite
URL after that URL has been revealed.

## Option A — VDO.Ninja lobby and transfer (recommended for the spike)

Each invitation opens a landing/lobby room. The director screens the guest and
transfers an approved connection into a secret production room. A transferred
guest does not learn the production destination. Refreshing or reconnecting
returns the guest to the lobby.

Revocation means, within the application boundary:

1. remove/transfer any current production connection;
2. mark the local invite generation `REVOKED`;
3. reject every later approval request for that invite generation;
4. require an explicit director approval for every production admission or
   reconnection, including after a local server restart;
5. allow the lobby to remain reachable.

Benefits: no mandatory paid service or public application backend. Cost: the
revoked link still establishes a VDO.Ninja lobby connection and admission
requires director action.

This is not a VDO.Ninja ban. Transfer secrecy alone is not an access-control
guarantee: a client may inspect or retain destination information, credentials
may already be known, and the application cannot intercept a direct VDO.Ninja
connection. A person with valid production destination information may bypass
the local approval UI. The spike must test and report this as a limitation, not
promise that revocation makes direct access impossible.

The director is also an availability and authority boundary. VDO.Ninja states
that the first director claims the room only while connected. If the director
disconnects, another director may claim it. Local automatic approval therefore
defaults to disabled whenever director presence is unknown or offline. This
reduces accidental approval but does not enforce VDO.Ninja's remote room policy.

## Option B — minimal public token broker

The public guest page calls an HTTPS, non-video endpoint. The broker stores only
hashed invitation tokens and checks expiry/revocation before returning the next
admission step.

Benefits: a revoked application link can fail before the guest page obtains
admission. Costs: public backend, operational security, persistence, abuse
protection, and more maintenance. If a reusable direct production URL was ever
returned to the browser, revoking the broker token alone cannot make that URL
unknown again; lobby/transfer or room rotation is still required.

## Decision

Use Option A for the technical spike because it has the smallest public attack
surface and lowest operating cost. Do not add a public broker in this version.

The accepted guarantee is limited to local control: a revoked invite cannot be
approved by the application, its camera is removed from the layout, and a
disconnect request is issued. Direct VDO.Ninja publication or viewing with
previously obtained destination data is outside this guarantee until real tests
prove an enforceable remote mechanism.

Publication approval, output viewing authorization, and layout visibility are
three independent controls. None may be reported as proof of another.
