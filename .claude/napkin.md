# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Security & Domain Guardrails
1. **[2026-10-31] Revocation is a local authorization boundary, not a VDO.Ninja ban**
   Do instead: report local approval, remote publication, viewing access, and layout visibility as separate outcomes.
2. **[2026-10-31] Real media claims require Windows/OBS evidence**
   Do instead: label browser/unit evidence separately and leave camera, audio-track, transparency, and remote-disconnect results MANUAL PENDING until observed.
3. **[2026-10-31] Use disposable public-safe identifiers only**
   Do instead: keep room names, passwords, capabilities, tokens, and client data out of source, fixtures, logs, screenshots, and commits.

## Execution & Validation
1. **[2026-10-31] Preserve mounted VDO frames during layout changes**
   Do instead: change CSS geometry on stable participant keys and verify the iframe DOM node is not replaced.
2. **[2026-10-31] Keep the spike local and fail closed**
   Do instead: bind to loopback, validate exact origins and role capabilities, reject stale revisions, and require fresh approval after restart.

## Repository Boundaries
1. **[2026-10-31] Camera Grid OBS is independent from Projeto Ville**
   Do instead: make all implementation commits inside `artifacts/camera-grid-obs-work` and never alter Ville's Production Core.
