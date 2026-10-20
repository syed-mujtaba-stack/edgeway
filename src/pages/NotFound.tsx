import { Link } from "react-router-dom";
import { company } from "@/data/site";
import { Seo } from "@/lib/seo";
import { Reveal } from "@/components/primitives";

export function NotFound() {
  return (
    <>
      <Seo
        title="Page not found | Edgeway Security Inc."
        description="That page doesn’t exist. Call (747) 370-4640 and talk to a person, or head back to the home page."
      />

      <section className="page-hero" aria-labelledby="page-title">
        <div className="container">
          <div className="page-hero__grid">
            <Reveal>
              <p className="eyebrow">404</p>
              <h1 className="h1" id="page-title">
                This Page Isn’t Here.
              </h1>
            </Reveal>
            <Reveal as="p" className="lede" delay={1}>
              The link may be old or mistyped. Head back to the start, or call{" "}
              <a className="text-link" href={company.phoneHref}>
                {company.phoneDisplay}
              </a>{" "}
              and talk to a person.
            </Reveal>
          </div>
          <Reveal className="hero__actions" delay={2}>
            <Link className="btn" to="/">
              Back to Home
            </Link>
            <Link className="btn btn--outline" to="/contact#quote">
              Request a Quote
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
