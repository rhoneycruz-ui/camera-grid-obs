# VDO.Ninja contract used by Camera Grid OBS

Checked against the official VDO.Ninja documentation on 2026-10-30. This file is
an allowlist: a parameter or iframe message not recorded here must not be emitted
by production code until it has an official source and a test.

## Sender contract

The guest publishes one stable `push` ID inside a `room` and receives no
microphone capability from our iframe. The generated URL also contains:

- `audiodevice=0`: disables the audio source and removes the audio-device choice;
- `webcam2`: presents the camera path rather than screen sharing;
- `quality=2`: a tolerant target of roughly 360p30 for the economy spike;
- `maxframerate=30`: permits a lower rate if 30 fps is unavailable;
- `maxvideobitrate=1200`: caps outbound video per viewer.

The initial target is deliberately economical. A 480p profile must be calibrated
with real cameras during Gate B; `quality=2` must not be described as 480p.

Sources:

- <https://docs.vdo.ninja/advanced-settings/setup-parameters/audiodevice>
- <https://docs.vdo.ninja/advanced-settings/setup-parameters>
- <https://docs.vdo.ninja/advanced-settings/video-parameters/and-quality>
- <https://docs.vdo.ninja/advanced-settings/video-parameters>
- <https://docs.vdo.ninja/advanced-settings/video-bitrate-parameters/and-maxvideobitrate>

## Viewer / OBS contract

The receiver uses exactly one of `view` or `scene`, plus its `room`, and:

- `noaudio`: disables incoming audio playback while retaining video/data;
- `cleanoutput`: hides VDO.Ninja interface elements;
- `videobitrate`: requests an allowlisted bitrate of 600, 1200, or 2500 kbps.

`cleanoutput` is not proof of alpha transparency. Transparency and absence of
audio in OBS remain manual Gate B checks.

Sources:

- <https://docs.vdo.ninja/advanced-settings/audio-parameters/noaudio>
- <https://docs.vdo.ninja/advanced-settings/design-parameters/cleanoutput>
- <https://docs.vdo.ninja/advanced-settings/video-bitrate-parameters/bitrate>
- <https://docs.vdo.ninja/advanced-settings/mixer-scene-parameters/scene>

## Room password

VDO.Ninja documents passwords as 1–49 case-sensitive alphanumeric characters.
The builder enforces that subset. A real password is a secret and must never be
committed, logged, pasted into an issue, or used in a public screenshot.

Source: <https://docs.vdo.ninja/advanced-settings/setup-parameters/and-password>

## Iframe messages

The spike accepts only these documented inbound action names:

`joining-room`, `guest-connected`, `push-connection`, `view-connection`,
`director-connected`, `scene-connected`, and `slot-updated`.

The later browser adapter must validate all three boundaries:

1. `event.origin` equals the configured VDO.Ninja origin;
2. `event.source` equals the expected iframe window;
3. `event.data` passes `VdoMessageSchema`.

Outgoing `postMessage` calls must use the exact origin, never `"*"`, even where
the documentation examples use a wildcard.

Sources:

- <https://docs.vdo.ninja/guides/iframe-api-documentation/iframe-api-basics>
- <https://docs.vdo.ninja/guides/iframe-api-documentation/iframe-api-for-directors>

## Access boundary — confirmed limitation

The reviewed official documentation describes room passwords, director kick,
lobby/transfer, and external access-control links. It does **not** document a
durable per-invite revocation list that makes an already revealed direct VDO URL
individually unusable.

The documentation describes a transferred guest as returning to the landing
room after refresh or reconnect. Camera Grid OBS treats that as expected product
behavior to test, not as a ban guarantee. Transfer does not prove that a client
cannot retain or inspect destination information, and local revocation cannot
intercept a direct connection to VDO.Ninja made with previously obtained room
data. The lobby may remain accessible.

`queue` is not a standalone production-room security boundary: the official
documentation warns that a guest can remove the parameter when it is used only
on the guest link. The first director also owns the room only while connected;
after disconnect another director can claim it. The spike must test director
loss and require explicit local production approval after recovery, while
reporting that this does not remotely enforce the VDO room.

Sources:

- <https://docs.vdo.ninja/guides/how-to-selectively-allow-access>
- <https://docs.vdo.ninja/guides/transfer-rooms>
- <https://docs.vdo.ninja/getting-started/rooms>
- <https://docs.vdo.ninja/advanced-settings/guest-queuing-parameters/queue>
- <https://docs.vdo.ninja/common-errors-and-known-issues/already-in-use-or-claimed-errors>
