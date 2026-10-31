import { ControlPage } from "./routes/ControlPage.js";
import { GuestPage } from "./routes/GuestPage.js";
import { OutputPage } from "./routes/OutputPage.js";

export function Router() {
  const capability = new URLSearchParams(window.location.search).get("cap") ?? "";
  if (window.location.pathname.startsWith("/guest")) {
    const params = new URLSearchParams(window.location.search);
    const roomPassword = params.get("password") ?? undefined;
    return (
      <GuestPage
        streamId={params.get("stream") ?? ""}
        roomId={params.get("room") ?? ""}
        {...(roomPassword === undefined ? {} : { roomPassword })}
      />
    );
  }
  if (window.location.pathname.startsWith("/output")) {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room") ?? undefined;
    const roomPassword = params.get("password") ?? undefined;
    return (
      <OutputPage
        capability={capability}
        receiverStrategy={params.get("receiver") === "scene" ? "native-scene" : "individual-viewers"}
        {...(roomId === undefined ? {} : { roomId })}
        {...(roomPassword === undefined ? {} : { roomPassword })}
      />
    );
  }
  return <ControlPage capability={capability} />;
}
