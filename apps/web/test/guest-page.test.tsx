import "@testing-library/jest-dom/vitest";

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GuestPage } from "../src/routes/GuestPage.js";

describe("GuestPage", () => {
  it("requires explicit consent before loading the video-only publisher", () => {
    const { getByRole, getByText, queryByTitle } = render(
      <GuestPage streamId="stream-1" roomId="LobbyRoom1" roomPassword="DemoOnly123" />,
    );
    expect(queryByTitle("Publicação da câmera")).not.toBeInTheDocument();
    expect(getByText(/não usa seu microfone/i)).toBeInTheDocument();

    fireEvent.click(getByRole("button", { name: /abrir minha câmera/i }));
    expect(queryByTitle("Publicação da câmera")).toBeInTheDocument();
  });
});
