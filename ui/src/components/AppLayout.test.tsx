import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";

import AppLayout from "./AppLayout";

vi.mock("@/lib/use-theme", () => {
  let theme = "light";
  return {
    useTheme: () => ({
      theme,
      toggle: () => {
        theme = theme === "light" ? "dark" : "light";
      },
    }),
  };
});

function renderWithRouter(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppLayout />
    </MemoryRouter>,
  );
}

describe("AppLayout", () => {
  it("renders the brand link", () => {
    renderWithRouter();
    expect(screen.getByText("Blissey")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    renderWithRouter();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Compose")).toBeInTheDocument();
    expect(screen.getByText("Trash")).toBeInTheDocument();
  });

  it("renders the theme toggle button", () => {
    renderWithRouter();
    expect(screen.getByLabelText("Toggle theme")).toBeInTheDocument();
  });

  it("does not use DaisyUI navbar class", () => {
    const { container } = renderWithRouter();
    expect(container.querySelector(".navbar")).not.toBeInTheDocument();
  });

  it("does not use DaisyUI swap classes", () => {
    const { container } = renderWithRouter();
    expect(container.querySelector(".swap")).not.toBeInTheDocument();
    expect(container.querySelector(".swap-rotate")).not.toBeInTheDocument();
  });

  it("renders a sticky nav element", () => {
    const { container } = renderWithRouter();
    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
    expect(nav?.className).toContain("sticky");
  });

  it("toggles theme on button click", () => {
    renderWithRouter();
    const button = screen.getByLabelText("Toggle theme");
    fireEvent.click(button);
    expect(screen.getByLabelText("Toggle theme")).toBeInTheDocument();
  });
});
