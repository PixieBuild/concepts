"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { SORTS, applyQuery, plural, queryHref, type ShopData, type ShopQuery } from "../_lib/query";

type LinkProps = { query: ShopQuery; onNavigate?: () => void; className?: string; children: ReactNode; "aria-current"?: "true" };

/** A real link, so every filtered view is shareable and works without JS; with JS it swaps the query in place. */
export function FilterLink({ query, onNavigate, className, children, ...rest }: LinkProps) {
  const href = queryHref(query);
  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState(null, "", href);
    onNavigate?.();
  };
  return (
    <Link href={href} prefetch={false} scroll={false} onClick={go} className={className} {...rest}>
      {children}
    </Link>
  );
}

type Option = { key: string; label: string; query: ShopQuery; on: boolean; count?: number };

function Group({ title, options, onNavigate }: { title: string; options: Option[]; onNavigate?: () => void }) {
  const id = `shop-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="label text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 border-t border-border">
        {options.map((option) => (
          <li key={option.key}>
            <FilterLink
              query={option.query}
              onNavigate={onNavigate}
              aria-current={option.on ? "true" : undefined}
              className={cn(
                "group/option flex min-h-11 items-center gap-3 border-b border-border text-[0.95rem] transition-colors",
                option.on ? "text-foreground" : "text-foreground/70 hover:text-foreground",
                option.count === 0 && !option.on && "text-foreground/35",
              )}
            >
              <span aria-hidden className={cn("size-1.5 shrink-0 transition-colors", option.on ? "bg-foreground" : "bg-transparent group-hover/option:bg-foreground/30")} />
              <span className="flex-1">{option.label}</span>
              {option.count !== undefined && <span className="label text-muted-foreground">{option.count}</span>}
            </FilterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Concern, type and sort, each counted against the other filters so a dead end shows before it is clicked. */
export function FilterPanel({ data, query, onNavigate, className }: { data: ShopData; query: ShopQuery; onNavigate?: () => void; className?: string }) {
  const count = (next: ShopQuery) => applyQuery(data, next).length;
  return (
    <div className={cn("flex flex-col gap-9", className)}>
      {data.concerns.length > 0 && (
        <Group
          title="Skin concern"
          onNavigate={onNavigate}
          options={data.concerns.map((f) => {
            const on = query.concern === f.id;
            return { key: f.id, label: f.label, on, query: { ...query, concern: on ? null : f.id }, count: count({ ...query, concern: f.id }) };
          })}
        />
      )}
      {data.types.length > 1 && (
        <Group
          title="Type"
          onNavigate={onNavigate}
          options={data.types.map((f) => {
            const on = query.type === f.id;
            return { key: f.id, label: plural(f.label), on, query: { ...query, type: on ? null : f.id }, count: count({ ...query, type: f.id }) };
          })}
        />
      )}
      <Group title="Sort" onNavigate={onNavigate} options={SORTS.map((s) => ({ key: s.id, label: s.label, on: query.sort === s.id, query: { ...query, sort: s.id } }))} />
    </div>
  );
}
