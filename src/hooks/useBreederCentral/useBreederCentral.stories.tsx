import type { Meta, StoryObj } from "@storybook/react-vite";
import { BreederCentralImage } from "../../components/BreederCentralImage";
import type { ImageCenter } from "../../components/BreederCentralImage";
import { useBreederCentral } from "./useBreederCentral";

interface RenderUseBreederCentralProps {
  apiUrl: string;
  apiKey: string;
}

const RenderUseBreederCentral = ({ apiUrl, apiKey }: RenderUseBreederCentralProps) => {
  const { animals, animalImages, offspringGroups, offspringImages, loading, error, refetch } =
    useBreederCentral(apiUrl, apiKey);

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 720 }}>
      <h1>useBreederCentral</h1>
      <p style={{ marginBlock: "8px 0" }}>
        apiUrl: <code>{apiUrl}</code>
      </p>
      <p style={{ marginBlock: "8px 16px" }}>
        loading: <strong>{String(loading)}</strong>
      </p>
      {error && (
        <p style={{ color: "#b00020", fontWeight: 600 }}>error: {error}</p>
      )}

      <button type="button" onClick={refetch}>
        Refetch (clears cache)
      </button>

      <h2>Animals ({animals.length})</h2>
      <ul>
        {animals.map((animal) => (
          <li key={animal.id}>
            #{animal.id} — {animal.name ?? "(no name)"}
          </li>
        ))}
      </ul>

      <h2>Animal images ({animalImages.length})</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {animalImages.map((image) => (
          <img
            key={image.id}
            src={image.signedUrl}
            alt={image.alt}
            width={120}
            height={90}
            style={{ objectFit: "cover" }}
          />
        ))}
      </div>

      <h2>Offspring groups ({offspringGroups.length})</h2>
      {offspringGroups.map((group) => (
        <div key={group.id} style={{ marginBottom: 16 }}>
          <h3>
            #{group.id} — {group.name} ({group.animals.length} animals,{" "}
            {group.events.length} events)
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(group.images ?? []).map((image) => (
              <div key={image.id} style={{ width: 120, height: 90 }}>
                <BreederCentralImage
                  imageUrl={image.signedUrl}
                  alt={image.alt}
                  center={[image.centerX, image.centerY] as ImageCenter}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <h2>Offspring images ({offspringImages.length})</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {offspringImages.map((image) => (
          <div key={image.id} style={{ width: 120, height: 90 }}>
            <BreederCentralImage
              imageUrl={image.signedUrl}
              alt={image.alt}
              center={[image.centerX, image.centerY] as ImageCenter}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const meta = {
  title: "Hooks/useBreederCentral",
  component: RenderUseBreederCentral,
  tags: ["autodocs"],
  argTypes: {
    apiUrl: { control: "text" },
    apiKey: { control: "text" },
  },
  args: {
    apiUrl: "https://your-api.example.com",
    apiKey: "your-api-key",
  },
} satisfies Meta<RenderUseBreederCentralProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};