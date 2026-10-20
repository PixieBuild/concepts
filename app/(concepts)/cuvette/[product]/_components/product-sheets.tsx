import type { ReactNode } from "react";
import Link from "next/link";

import { HELP, POLICY } from "../../_lib/content";
import { isSet, type Product, type Study as StudyData } from "../../_lib/product";
import { formatDate } from "../../_lib/format";
import { canShow } from "../../_lib/stills";
import { Bottle } from "../../_components/bottle/bottle";
import { DetailSheet } from "./detail-sheet";

export const SHEETS = {
  formula: "formula",
  howTo: "how-to",
  study: "study",
  delivery: "delivery",
  storage: "storage",
} as const;

const ink = (p: Product) => ({ color: `var(${p.colour.cssVar})` });

function Rows({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-border border-y border-border">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[7.5rem_1fr] gap-4 py-3">
          <dt className="label pt-0.5 text-muted-foreground">{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Formula({ product }: { product: Product }) {
  return (
    <section className="space-y-6">
      <ul className="divide-y divide-border border-y border-border">
        {product.actives.map((a) => (
          <li key={a.name} className="flex items-baseline justify-between gap-6 py-3.5">
            <span>
              <span className="block">{a.name}</span>
              <span className="text-[0.8125rem] text-muted-foreground">{a.does}</span>
            </span>
            <span className="text-2xl font-light [font-stretch:125%]" style={ink(product)}>
              {a.amount}
            </span>
          </li>
        ))}
      </ul>
      {product.formulaNote && <p className="text-muted-foreground">{product.formulaNote}</p>}
      <div>
        <h3 className="label text-muted-foreground">Full formula (INCI)</h3>
        <p className="mt-3 font-mono text-[0.8125rem] leading-relaxed">{product.inci.join(", ")}.</p>
      </div>
      <p className="label text-muted-foreground">
        Fragrance-free{product.ph && ` · pH ${product.ph}`}
        {product.lot.code && ` · Lot ${product.lot.code}`}
        {product.lot.filled && `, filled ${formatDate(product.lot.filled)}`}
      </p>
    </section>
  );
}

function HowTo({ product }: { product: Product }) {
  const image = !isSet(product) && (canShow(product, "drop-stone") || canShow(product, "drop"));
  return (
    <div className="space-y-6">
      {image && (
        <div className="relative -mx-6 aspect-[16/10] overflow-hidden sm:-mx-8">
          <Bottle product={product} shot={canShow(product, "drop-stone") ? "drop-stone" : "drop"} sizes="32rem" fallback={false} />
        </div>
      )}
      <ol className="divide-y divide-border border-y border-border">
        {product.howTo.steps.map((s, i) => (
          <li key={s} className="grid grid-cols-[2.5rem_1fr] py-3.5">
            <span className="label pt-1 text-muted-foreground">0{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <Rows
        rows={[
          { label: "When", value: product.when.join(" and ") },
          { label: "Layering", value: product.howTo.layering },
          { label: "Avoid", value: product.howTo.avoid },
          ...(product.pao ? [{ label: "After opening", value: `Use within ${parseInt(product.pao)} months` }] : []),
        ]}
      />
    </div>
  );
}

function Study({ study: s }: { study: StudyData }) {
  return (
    <div className="space-y-6">
      <ul className="grid grid-cols-3 gap-4">
        {s.results.map((r) => (
          <li key={r.label}>
            <span className="block text-[2.5rem] leading-none font-extralight [font-stretch:125%] tracking-[-0.04em]">{r.value}%</span>
            <span className="mt-2 block text-[0.8125rem] text-muted-foreground">{r.label}</span>
          </li>
        ))}
      </ul>
      <Rows
        rows={[
          { label: "Participants", value: `${s.n}, ages ${s.ages}` },
          { label: "Skin", value: s.skin },
          { label: "Use", value: `${s.use}, ${s.weeks} weeks` },
          { label: "Measure", value: s.measure },
          { label: "Year", value: s.year },
        ]}
      />
      <p className="text-muted-foreground">{s.note}</p>
    </div>
  );
}

function Delivery() {
  const groups = [...HELP.delivery, ...HELP.returns];
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.title}>
          <h3 className="product-name">{g.title}</h3>
          <p className="mt-1 text-muted-foreground">{g.body}</p>
        </div>
      ))}
      <p className="label text-muted-foreground">Order before {POLICY.cutoff} Lisbon time · Mon–Fri</p>
    </div>
  );
}

function Storage({ product }: { product: Product }) {
  if (!product.storage) return null;
  return (
    <div className="space-y-6">
      <p className="title">{product.storage.headline}</p>
      <ol className="grid grid-cols-5 gap-1.5" aria-label="Colour by days since opening">
        {product.storage.strip.map((d) => (
          <li key={d.day}>
            <span className="block aspect-[3/4] rounded-(--radius)" style={{ background: d.colour }} />
            <span className="label mt-2 block">Day {d.day}</span>
            <span className="block text-[0.8125rem] text-muted-foreground">{d.label}</span>
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground">{product.storage.body}</p>
    </div>
  );
}

export function ProductSheets({ product }: { product: Product }) {
  const set = isSet(product);
  const parts = set ? product.parts : [product];
  return (
    <>
      <DetailSheet id={SHEETS.formula} eyebrow={`${product.code} · Formula`} title={set ? "Inside the set" : "Formula & full INCI"}>
        <div className="space-y-12">
          {parts.map((p) => (
            <div key={p.slug} className="space-y-4">
              {set && (
                <h3 className="product-name text-lg">
                  <Link href={`/cuvette/${p.slug}`} className="link">
                    {p.title}
                  </Link>
                </h3>
              )}
              <Formula product={p} />
            </div>
          ))}
        </div>
      </DetailSheet>
      <DetailSheet id={SHEETS.howTo} eyebrow="How to use" title={product.howTo.headline}>
        <HowTo product={product} />
      </DetailSheet>
      {!set && product.study && (
        <DetailSheet id={SHEETS.study} eyebrow={`Consumer study · ${product.study.year}`} title={`${product.title}, ${product.study.weeks} weeks`} description="Self-assessed. Not a clinical trial.">
          <Study study={product.study} />
        </DetailSheet>
      )}
      <DetailSheet id={SHEETS.delivery} eyebrow="Ships from Porto" title="Delivery & returns">
        <Delivery />
      </DetailSheet>
      {product.storage && (
        <DetailSheet id={SHEETS.storage} eyebrow="Storage & colour" title="How it ages">
          <Storage product={product} />
        </DetailSheet>
      )}
    </>
  );
}

export function sheetRows(product: Product): { id: string; label: string }[] {
  const set = isSet(product);
  return [
    { id: SHEETS.formula, label: set ? "Inside the set & full INCI" : "Formula & full INCI" },
    { id: SHEETS.howTo, label: "How to use" },
    ...(set || !product.study ? [] : [{ id: SHEETS.study, label: "Study details" }]),
    { id: SHEETS.delivery, label: "Delivery & returns" },
    ...(product.storage ? [{ id: SHEETS.storage, label: "Storage & colour" }] : []),
  ];
}
