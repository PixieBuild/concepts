import { preload as preloadImage } from "react-dom";
import { getImageProps } from "next/image";

import { TALL_MEDIA, variantLoader, type HeroImage } from "@/app/(concepts)/casa-lume/_lib/hero-lights";

type Props = {
  wide: HeroImage;
  tall: HeroImage;
  alt: string;
  wideSizes: string;
  tallSizes: string;
  className?: string;
  imgRef?: React.Ref<HTMLImageElement>;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  fetchPriority?: "high" | "low" | "auto";
  loading?: "eager" | "lazy";
  /** Preloads only the crop the viewport will actually use. */
  preload?: boolean;
};

const WIDE_MEDIA = "(min-aspect-ratio: 1001/1000)";

export function PlatePicture({
  wide,
  tall,
  alt,
  wideSizes,
  tallSizes,
  className,
  imgRef,
  onLoad,
  fetchPriority,
  loading = "eager",
  preload = false,
}: Props) {
  const {
    props: { srcSet: tallSet },
  } = getImageProps({
    src: tall.src,
    fill: true,
    alt,
    sizes: tallSizes,
    loader: variantLoader(tall),
  });
  const { props } = getImageProps({
    src: wide.src,
    fill: true,
    alt,
    sizes: wideSizes,
    loader: variantLoader(wide),
    loading,
    fetchPriority,
  });

  if (preload) {
    preloadImage(tall.src, { as: "image", imageSrcSet: tallSet, imageSizes: tallSizes, media: TALL_MEDIA, fetchPriority: "high" });
    preloadImage(wide.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: wideSizes, media: WIDE_MEDIA, fetchPriority: "high" });
  }

  return (
    <picture>
      <source media={TALL_MEDIA} srcSet={tallSet} sizes={tallSizes} />
      <img {...props} ref={imgRef} onLoad={onLoad} alt={alt} className={className} />
    </picture>
  );
}
