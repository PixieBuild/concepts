import type { Metadata } from "next";

import { Footer } from "../../_components/footer";
import { Header } from "../../_components/header";
import { Confirmation } from "./_components/confirmation";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default async function ConfirmationPage({ searchParams }: PageProps<"/cuvette/checkout/confirmation">) {
  const { order } = await searchParams;
  return (
    <>
      <Header variant="solid" />
      <main className="flex-1">
        <Confirmation id={typeof order === "string" ? order : null} />
      </main>
      <Footer />
    </>
  );
}
