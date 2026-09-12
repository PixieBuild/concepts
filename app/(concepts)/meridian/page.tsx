import { SiteNav } from "./_components/site-nav";
import { Hero } from "./_components/hero";
import { Stats } from "./_components/stats";
import { Services } from "./_components/services";
import { Booking } from "./_components/booking";
import { Craft } from "./_components/craft";
import { Reviews } from "./_components/reviews";
import { Cta } from "./_components/cta";
import { SiteFooter } from "./_components/site-footer";

export default function MeridianSalonPage() {
  return (
    <>
      <SiteNav />
      <Hero />
      <Stats />
      <Services />
      <Booking />
      <Craft />
      <Reviews />
      <Cta />
      <SiteFooter />
    </>
  );
}
