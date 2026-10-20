import { company, faqs } from "@/data/site";
import { Seo } from "@/lib/seo";
import { FAQList, Reveal } from "@/components/primitives";
import { QuoteForm } from "@/components/QuoteForm";

export function Contact() {
  return (
    <>
      <Seo
        title="Contact & Request a Quote | Edgeway Security Inc."
        description={`Call ${company.phoneDisplay} or email ${company.email}. Request a security quote for guards, cameras or vehicle patrol anywhere in California.`}
      />

      <section className="contact" aria-labelledby="page-title">
        <div className="container contact__grid">
          <Reveal className="contact__intro">
            <p className="eyebrow">Contact</p>
            <h1 className="h1" id="page-title">
              Let’s Talk About Your&nbsp;Site.
            </h1>
            <p className="lede">
              Tell us what you need protecting. We’ll walk through it with you and build a plan that
              fits your site and your budget.
            </p>
            <ul className="channels">
              <li>
                <span className="label">Phone</span>
                <a className="value" href={company.phoneHref}>
                  {company.phoneDisplay}
                </a>
              </li>
              <li>
                <span className="label">Email</span>
                <a className="value" href={company.emailHref}>
                  {company.email}
                </a>
              </li>
              {/* TODO: replace with the real street address */}
              <li>
                <span className="label">Address</span>
                <span className="value">
                  <span className="placeholder">{company.address.line1}</span>
                  <br />
                  <span className="placeholder">{company.address.line2}</span>
                </span>
              </li>
              <li>
                <span className="label">Dispatch</span>
                <span className="value">Available 24/7</span>
              </li>
            </ul>
          </Reveal>

          <Reveal className="form-card" id="quote" delay={1}>
            <div className="form-card__head">
              <h2 className="h3">Request a Quote</h2>
              <p>Takes about a minute. Need someone today? Call&nbsp;us.</p>
            </div>
            <QuoteForm />
          </Reveal>
        </div>
      </section>

      <section className="section section--alt" id="faq" aria-labelledby="faq-title">
        <div className="container faq-grid">
          <Reveal className="faq-grid__intro">
            <p className="eyebrow">FAQ</p>
            <h2 className="h2" id="faq-title">
              Questions, Answered.
            </h2>
            <p className="lede">
              Something else on your mind? Call{" "}
              <a className="text-link" href={company.phoneHref}>
                (747)&nbsp;370-4640
              </a>{" "}
              and talk to a person.
            </p>
          </Reveal>
          <FAQList items={faqs} delay={1} />
        </div>
      </section>
    </>
  );
}
