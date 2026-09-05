import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImageDisplay, type ImageCenter } from "./ImageDisplay";

const IMAGE_URL = "https://example.com/photo.jpg";

describe("ImageDisplay", () => {
  it("renders an img with the imageUrl and alt", () => {
    render(<ImageDisplay imageUrl={IMAGE_URL} alt="A photo" />);
    const img = screen.getByRole("img", { name: "A photo" });
    expect(img).toHaveAttribute("src", IMAGE_URL);
  });

  it("applies a default focal point of 50% 50%", () => {
    render(<ImageDisplay imageUrl={IMAGE_URL} alt="A photo" />);
    const img = screen.getByRole("img", { name: "A photo" });
    expect(img).toHaveStyle({ objectPosition: "50% 50%" });
  });

  it("applies a custom focal point", () => {
    render(<ImageDisplay imageUrl={IMAGE_URL} alt="A photo" center={[0, 100]} />);
    const img = screen.getByRole("img", { name: "A photo" });
    expect(img).toHaveStyle({ objectPosition: "0% 100%" });
  });

  it("clamps out-of-range focal point values", () => {
    const outOfRange = [-20, 150] as unknown as ImageCenter;
    render(<ImageDisplay imageUrl={IMAGE_URL} alt="A photo" center={outOfRange} />);
    const img = screen.getByRole("img", { name: "A photo" });
    expect(img).toHaveStyle({ objectPosition: "0% 100%" });
  });

  it("applies the objectFit prop", () => {
    render(<ImageDisplay imageUrl={IMAGE_URL} alt="A photo" objectFit="contain" />);
    const img = screen.getByRole("img", { name: "A photo" });
    expect(img).toHaveStyle({ objectFit: "contain" });
  });

  it("passes className and style to the container", () => {
    const { container } = render(
      <ImageDisplay imageUrl={IMAGE_URL} alt="A photo" className="hero" style={{ width: "50%" }} />,
    );
    const div = container.firstElementChild;
    expect(div).toHaveClass("hero");
    expect(div).toHaveStyle({ width: "50%" });
  });
});