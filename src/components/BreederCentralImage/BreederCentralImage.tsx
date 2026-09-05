import type { CSSProperties } from "react";
import { cx } from "../../utils/cx";
import styles from "./BreederCentralImage.module.css";

type Enumerate<N extends number, Acc extends number[] = []> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<F extends number, T extends number> =
  | (F extends 0 ? 0 : never)
  | Exclude<Enumerate<T>, Enumerate<F>>
  | T;

type ValidPercentage = IntRange<0, 100>;
export type ImageCenter = [ValidPercentage, ValidPercentage];

export type BreederCentralImageProps = {
  imageUrl: string;
  alt: string;
  center?: ImageCenter;
  className?: string;
  style?: CSSProperties;
  objectFit?: "cover" | "contain";
};

const DEFAULT_CENTER: ImageCenter = [50, 50];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const BreederCentralImage = (props: BreederCentralImageProps) => {
  const { className, style, imageUrl, alt, center = DEFAULT_CENTER, objectFit = "cover" } = props;

  const [x, y] = center;
  const objectPosition = `${clamp(x, 0, 100)}% ${clamp(y, 0, 100)}%`;

  return (
    <div className={cx(styles.container, className)} style={style}>
      <img
        src={imageUrl}
        alt={alt}
        className={styles.image}
        style={{ objectFit, objectPosition }}
      />
    </div>
  );
};

export default BreederCentralImage;