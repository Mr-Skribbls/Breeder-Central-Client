import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImageDisplay } from "./ImageDisplay";

const meta = {
  title: "Components/ImageDisplay",
  component: ImageDisplay,
  tags: ["autodocs"],
  argTypes: {
    center: { control: { type: "object" } },
    objectFit: { control: "select", options: ["cover", "contain"] },
  },
  args: {
    alt: "A photo",
    imageUrl: "https://picsum.photos/seed/breeder/800/600",
  },
} satisfies Meta<typeof ImageDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FocalPointTopLeft: Story = {
  args: { center: [0, 0] },
};

export const FocalPointBottomRight: Story = {
  args: { center: [100, 100] },
};

export const Contain: Story = {
  args: { objectFit: "contain" },
};