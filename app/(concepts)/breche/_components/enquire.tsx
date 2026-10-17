import { COMPANY, GUIDES } from "../_lib/content";
import { telHref } from "../_lib/format";
import { EnquiryForm } from "./enquiry-form";
import { Frame } from "./frame";
import { Reveal } from "./reveal";
import { SectionHead } from "./section-head";

export function Enquire({ shell, onDuty }: { shell: string; onDuty: string }) {
  const guide = GUIDES.find((g) => g.name === onDuty);

  return (
    <section id="enquire" tabIndex={-1} aria-labelledby="enquire-title" className="bg-(--ink) pt-20 pb-24 text-(--snow) sm:pt-28 lg:pt-32 lg:pb-32">
      <div className={`${shell} grid gap-y-16 md:grid-cols-12 md:gap-x-10 md:gap-y-4 lg:gap-x-14`}>
        <div className="md:col-span-7 md:row-start-1 lg:col-span-8">
          <SectionHead id="enquire-title" tone="ink" label={`${COMPANY.street} · open ${COMPANY.hours.label}`} title="Tell us the week you have." />
          <p className="lead mt-6 max-w-[44ch] text-(--snow)/80">Tell us when and what; the guide on duty writes back.</p>
          {guide && (
            <figure className="-mx-6 mt-10 sm:-mx-10 md:hidden">
              <Frame slot={guide.slot} sizes="100vw" className="aspect-3/2" />
              <figcaption className="label mt-3 px-6 text-(--snow)/70 sm:px-10">{onDuty} · on duty tonight</figcaption>
            </figure>
          )}
        </div>

        {guide && (
          <figure className="max-md:hidden md:col-span-5 md:col-start-8 md:row-start-1 lg:col-span-3 lg:col-start-10">
            <Reveal kind="photo">
              <Frame slot={guide.slot} sizes="(min-width: 1024px) 20rem, 40vw" className="aspect-4/5 w-full max-w-80" />
            </Reveal>
            <figcaption className="label mt-3 text-(--snow)/70">{onDuty} · on duty tonight</figcaption>
          </figure>
        )}

        <div className="md:col-span-12 md:row-start-2 lg:col-span-8">
          <EnquiryForm />
        </div>

        <aside aria-label="The office" className="grid content-start gap-y-10 md:col-span-12 md:grid-cols-3 md:gap-x-10 md:row-start-3 md:mt-16 lg:col-span-3 lg:col-start-10 lg:row-start-2 lg:mt-12 lg:grid-cols-1">
          <div>
            <h3 className="label text-(--snow)/70">Or ring the office</h3>
            <a href={telHref(COMPANY.phone)} className="title mt-1 inline-flex min-h-11 items-center tabular-nums underline-offset-[6px] hover:underline">
              {COMPANY.phone}
            </a>
            <p className="note mt-1 text-(--snow)/70">{COMPANY.hours.label}</p>
          </div>
          <div>
            <h3 className="label text-(--snow)/70">Write</h3>
            <a href={`mailto:${COMPANY.email}`} className="body mt-1 inline-flex min-h-11 items-center break-all underline underline-offset-4 hover:text-(--glacier)">
              {COMPANY.email}
            </a>
          </div>
          <div>
            <h3 className="label text-(--snow)/70">Find us</h3>
            <address lang="fr" className="body mt-2 text-(--snow)/90 not-italic">
              {COMPANY.street}
              <br />
              {COMPANY.town}
            </address>
          </div>
        </aside>
      </div>
    </section>
  );
}
