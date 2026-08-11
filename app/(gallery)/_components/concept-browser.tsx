"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ConceptCard } from "./concept-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CONCEPT_CATEGORIES,
  type Concept,
  type ConceptCategory,
} from "@/lib/concepts";

type Filter = ConceptCategory | "all";

export function ConceptBrowser({
  concepts,
  categories,
}: {
  concepts: Concept[];
  categories: ConceptCategory[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["all", concepts.length]]);
    for (const concept of concepts) {
      map.set(concept.category, (map.get(concept.category) ?? 0) + 1);
    }
    return map;
  }, [concepts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return concepts.filter((concept) => {
      if (filter !== "all" && concept.category !== filter) return false;
      if (!q) return true;
      return [
        concept.name,
        concept.tagline,
        concept.description,
        concept.industry,
        concept.bestFor ?? "",
        CONCEPT_CATEGORIES[concept.category],
        ...concept.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [concepts, filter, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by industry, style, or keyword…"
            className="pl-9"
            aria-label="Search concepts"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", ...categories] as Filter[]).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All" : CONCEPT_CATEGORIES[value]}
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 text-[0.7rem] font-normal"
              >
                {counts.get(value) ?? 0}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {results.length} {results.length === 1 ? "concept" : "concepts"}
      </p>

      {results.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No concepts match that search.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((concept) => (
            <ConceptCard key={concept.slug} concept={concept} />
          ))}
        </div>
      )}
    </div>
  );
}
