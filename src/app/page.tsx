import { Hero } from "@/components/landing/hero";
import { Insight } from "@/components/landing/insight";
import { Philosophy } from "@/components/landing/philosophy";
import { Privacy } from "@/components/landing/privacy";
import { Returning } from "@/components/landing/returning";
import { Rhythm } from "@/components/landing/rhythm";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function Home() {
  return (
    <div className="relative">
      <main>
        <div className="relative">
          <SiteHeader />
          <Hero />
        </div>
        <Philosophy />
        <Rhythm />
        <Insight />
        <Returning />
        <Privacy />
      </main>
      <SiteFooter />
    </div>
  );
}
