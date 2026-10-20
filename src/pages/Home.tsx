import { Link } from "react-router-dom";
import {
  approachSteps,
  assurePoints,
  company,
  dispatchPoints,
  faqs,
  images,
  sectors,
} from "@/data/site";
import { Seo } from "@/lib/seo";
import { FAQList, NavArrow, ResponsiveImage, Reveal } from "@/components/primitives";
import { ServicesTabs } from "@/components/ServicesTabs";
import { Cta } from "@/components/Cta";

export function Home() {
  return (
    <>
      <Seo
        title="Edgeway Security Inc. | Guards, Cameras & Vehicle Patrol in California"
        description="Edgeway Security Inc. provides unarmed and armed guards, off-duty police officers, camera installation, solar cameras and vehicle patrol across California, all monitored 24/7 by dispatch."
        ogTitle="Edgeway Security Inc. | Each site is unique. So are we."
        ogDescription="Security guards, cameras and vehicle patrol across California, monitored 24/7 by dispatch."
      />

      {/* Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container">
          <Reveal as="p" className="eyebrow">
            Protection at Every Edge
          </Reveal>
          <Reveal as="h1" className="display hero__title" id="hero-title" delay={1}>
            Each Site Is Unique. So&nbsp;Are&nbsp;We.
          </Reveal>
          <Reveal as="p" className="lede hero__lede" delay={2}>
            We know each job is different, and each site has its own security needs. That’s why we work
            with you, hand in hand, to develop the right solution for your site, shipment, property, or
            whatever else you need protecting. Bringing you peace of mind, so you can focus on what
            matters most.
          </Reveal>
          <Reveal className="hero__actions" delay={3}>
            <Link className="btn" to="/contact#quote">
              Get a Quote
            </Link>
            <a className="link-arrow" href={company.phoneHref}>
              Call {company.phoneDisplay}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M2 8h11M9 4l4 4-4 4" />
              </svg>
            </a>
          </Reveal>

          <figure className="hero__media">
            <div className="frame frame--hero">
              <ResponsiveImage
                image={images.hero}
                sizes="(min-width: 85rem) 78rem, 100vw"
                priority
              />
            </div>
          </figure>

          <ul className="assure" aria-label="At a glance">
            {assurePoints.map((point, i) => (
              <Reveal as="li" key={point.title} delay={i as 0 | 1 | 2 | 3}>
                <strong>{point.title}</strong>
                <span>{point.note}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Services selector */}
      <section className="section" aria-labelledby="services-title">
        <div className="container">
          <Reveal className="section-head section-head--center">
            <p className="eyebrow">What We Do</p>
            <h2 className="h2" id="services-title">
              Guards, Cameras, Patrol. One Team Behind All&nbsp;Three.
            </h2>
            <p className="lede">
              Most sites need a mix. We help you choose the right combination, and our dispatch team
              ties it all together around the clock.
            </p>
          </Reveal>

          <ServicesTabs />
        </div>
      </section>

      {/* Dispatch */}
      <section className="band" aria-labelledby="dispatch-title">
        <div className="container band__grid">
          <Reveal>
            <p className="eyebrow">Dispatch · 24/7</p>
            <h2 className="h2" id="dispatch-title">
              Someone Is Always Watching.
            </h2>
            <p className="lede">
              Every camera and patrol vehicle we run is monitored around the clock by our dispatch
              team. If something happens on your site at 3&nbsp;a.m., we know about it, and we act on
              it.
            </p>
            <dl className="points">
              {dispatchPoints.map((point) => (
                <div key={point.term}>
                  <dt>{point.term}</dt>
                  <dd>{point.description}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={2} className="frame">
            <ResponsiveImage image={images.dispatch} sizes="(min-width: 56rem) 44rem, 100vw" />
          </Reveal>
        </div>
      </section>

      {/* Industries */}
      <section className="section" aria-labelledby="industries-title">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <p className="eyebrow">Who We Protect</p>
              <h2 className="h2" id="industries-title">
                From School Campuses to Critical Infrastructure.
              </h2>
            </div>
            <p className="lede">
              Every industry carries different risks. We tailor staffing, cameras and patrols to match
              the site in front of us.
            </p>
          </Reveal>

          <div className="groups">
            {sectors.map((sector, i) => (
              <Reveal key={sector.id} delay={i as 0 | 1 | 2}>
                <h3 className="group__head">
                  {sector.jumpLabel} <span>{String(sector.items.length).padStart(2, "0")}</span>
                </h3>
                <ul className="index">
                  {sector.items.map((item) => (
                    <li key={item.num}>
                      <span className="num">{item.num}</span>
                      {item.title}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <div className="section-foot">
            <p className="muted">Don’t see your site type? Ask us.</p>
            <NavArrow caps to="/industries">
              Industries We Serve
            </NavArrow>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="section section--alt" aria-labelledby="approach-title">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <p className="eyebrow">How We Work</p>
              <h2 className="h2" id="approach-title">
                Hand in Hand, From the First Call to Every&nbsp;Shift.
              </h2>
            </div>
            <p className="lede">
              No two properties share the same weak points. We start by listening, then build coverage
              that fits your site and your budget.
            </p>
          </Reveal>
          <ol className="steps">
            {approachSteps.map((step, i) => (
              <Reveal as="li" key={step.num} className="step" delay={i as 0 | 1 | 2}>
                <span className="step__num" aria-hidden="true">
                  {step.num}
                </span>
                <h3 className="h3">{step.title}</h3>
                <p>{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" aria-labelledby="faq-title">
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

      <Cta />
    </>
  );
}
