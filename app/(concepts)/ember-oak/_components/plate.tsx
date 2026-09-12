import Image from "next/image";

import { cn } from "@/lib/utils";
import { RevealImage } from "./motion";

export function Plate({
  numeral,
  caption,
  image,
  tallImage,
  ratio = "aspect-[4/5]",
  sizes,
  priority = false,
  className,
  captionClassName,
  children,
}: {
  numeral: string;
  caption: string;
  image: { src: string; alt: string };
  tallImage?: { src: string; alt: string };
  ratio?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  captionClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <figure className={cn("m-0", className)}>
      <div className="relative">
        <div className="border border-foreground p-1.5 sm:p-2">
          <RevealImage className="border border-foreground">
            <div className={cn("relative", ratio)}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={priority}
                quality={90}
                sizes={sizes}
                className={cn("object-cover", tallImage && "hidden sm:block")}
              />
              {tallImage && (
                <Image
                  src={tallImage.src}
                  alt={tallImage.alt}
                  fill
                  priority={priority}
                  quality={90}
                  sizes="100vw"
                  className="object-cover sm:hidden"
                />
              )}
            </div>
          </RevealImage>
        </div>
        {children}
      </div>
      <figcaption
        className={cn(
          "mt-3.5 font-heading text-[0.95rem] italic leading-snug sm:text-base",
          captionClassName,
        )}
      >
        <span className="not-italic">Plate {numeral}.</span> {caption}
      </figcaption>
    </figure>
  );
}
