"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Link2, Moon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CONCEPT_CATEGORIES, conceptPath, type Concept } from "@/lib/concepts";

const MAX_TAGS = 4;

export function ConceptCard({ concept }: { concept: Concept }) {
  const [copied, setCopied] = useState(false);
  const href = conceptPath(concept.slug);
  const hiddenTags = concept.tags.length - MAX_TAGS;

  async function copyLink() {
    await navigator.clipboard.writeText(
      new URL(href, window.location.origin).toString(),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Card className="group flex flex-col overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <div
        className="relative aspect-video w-full overflow-hidden border-b"
        style={{ backgroundColor: concept.theme.accent }}
      >
        {concept.thumbnail && (
          <Image
            src={concept.thumbnail}
            alt=""
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top"
          />
        )}
      </div>

      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{concept.name}</CardTitle>
          <div className="flex shrink-0 items-center gap-1.5">
            {concept.theme.supportsDarkMode && (
              <Moon
                className="size-3.5 text-muted-foreground"
                aria-label="Ships dark mode"
              />
            )}
            {concept.status === "draft" && (
              <Badge variant="outline" className="text-[0.7rem]">
                Draft
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {concept.tagline}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2.5">
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {concept.description}
        </p>

        <p className="flex flex-wrap gap-x-1.5 text-xs text-muted-foreground *:whitespace-nowrap">
          <span className="font-medium text-foreground">
            {concept.industry}
          </span>
          <span>{CONCEPT_CATEGORIES[concept.category]}</span>
          <span>{concept.theme.fonts}</span>
          <span title={concept.pages.map((p) => p.label).join(", ")}>
            {concept.pages.length} {concept.pages.length === 1 ? "page" : "pages"}
          </span>
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {concept.tags.slice(0, MAX_TAGS).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[0.7rem] font-normal"
            >
              {tag}
            </Badge>
          ))}
          {hiddenTags > 0 && (
            <Badge
              variant="outline"
              className="text-[0.7rem] font-normal"
              title={concept.tags.slice(MAX_TAGS).join(", ")}
            >
              +{hiddenTags}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          size="sm"
          nativeButton={false}
          render={
            <Link href={href} target="_blank" rel="noopener noreferrer" />
          }
        >
          Open concept
          <ArrowUpRight data-icon="inline-end" />
        </Button>
        <Button variant="outline" size="sm" onClick={copyLink}>
          {copied ? (
            <Check data-icon="inline-start" />
          ) : (
            <Link2 data-icon="inline-start" />
          )}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </CardFooter>
    </Card>
  );
}
