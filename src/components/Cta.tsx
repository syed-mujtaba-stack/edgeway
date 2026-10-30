import { Link } from "react-router-dom";
import { images } from "@/data/site";
import { useSiteCompany } from "@/context/SiteSettings";
import { ResponsiveImage, Reveal } from "@/components/primitives";

/** The closing call-to-action band, shared by every page. */
export function Cta() {
  const company = useSiteCompany();

  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="cta__bg" aria-hidden="true">
        <ResponsiveImage image={images.nightPatrol} sizes="100vw" alt="" />
      </div>
      <Reveal className="container">
        <p className="eyebrow">Get Started</p>
        <h2 className="h1" id="cta-title">
          Tell Us About Your&nbsp;Site.
        </h2>
        <p className="lede">We’ll walk through it with you and put together a plan that fits.</p>
        <a className="cta__phone" href={company.phoneHref}>
          {company.phoneDisplay}
        </a>
        <div className="cta__actions">
          <Link className="btn btn--gold" to="/contact#quote">
            Request a Quote
          </Link>
          <a className="btn btn--outline-light" href={company.emailHref}>
            Email Us
          </a>
        </div>
      </Reveal>
    </section>
  );
}
