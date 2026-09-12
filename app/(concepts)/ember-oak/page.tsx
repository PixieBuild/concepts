import { Colophon } from "./_components/colophon";
import { Counter } from "./_components/counter";
import { CupFlight } from "./_components/cup-flight";
import { HeroPlate } from "./_components/hero-plate";
import { Divider } from "./_components/mark";
import { Masthead } from "./_components/masthead";
import { Roast } from "./_components/roast";
import { Room } from "./_components/room";
import { Visit } from "./_components/visit";

export default function EmberOakPage() {
  return (
    <>
      <Masthead />
      <CupFlight>
        <HeroPlate />
        <Counter />
      </CupFlight>
      <Divider index={0} className="py-16 sm:py-20 lg:py-24" />
      <Roast />
      <Divider index={1} className="py-16 sm:py-20 lg:py-24" />
      <Room />
      <Divider index={0} className="py-16 sm:py-20 lg:py-24" />
      <Visit />
      <div className="h-20 sm:h-24 lg:h-28" />
      <Colophon />
    </>
  );
}
