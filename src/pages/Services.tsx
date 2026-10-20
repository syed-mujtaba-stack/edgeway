import { Link } from "react-router-dom";
import { images, services } from "@/data/site";
import { Seo } from "@/lib/seo";
import { ResponsiveImage, Reveal } from "@/components/primitives";
import { Cta } from "@/components/Cta";

export function Services() {
  return (
    <>
      <Seo
        title="Services | Security Guards, Cameras & Vehicle Patrol | Edgeway Security Inc."
        description="Unarmed and armed guards, off-duty police officers, camera installation, solar cameras, 24/7 monitoring, lot patrol and escorts across California."
        ogTitle="Edgeway Security Inc. | Each site is unique. So are we."
        ogDescription="Security guards, cameras and vehicle patrol across California, monitored 24/7 by dispatch."
      />

      <section className="page-hero" aria-labelledby="page-title">
        <div className="container">
          <div className="page-hero__grid">
            <Reveal>
              <p className="eyebrow">Services</p>
              <h1 className="h1" id="page-title">
                Three Ways to Protect a&nbsp;Site.
              </h1>
            </Reveal>
            <Reveal as="p" className="lede" delay={1}>
              People, cameras and vehicles. Use one, or let us combine them into a plan that fits your
              site and budget, with dispatch watching it all 24/7.
            </Reveal>
          </div>

          <Reveal as="nav" className="jump" delay={2} aria-label="Jump to a service">
            {services.map((service, i) => (
              <a key={service.key} href={`#${service.key}`}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                {service.tab}
              </a>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section section--tight" aria-label="Service details">
        <div className="container">
          {services.map((service, i) => (
            <article
              key={service.key}
              className={["feature", i % 2 === 1 ? "feature--flip" : null].filter(Boolean).join(" ")}
              id={service.key}
              aria-labelledby={`${service.key}-title`}
            >
              <Reveal className="frame feature__media">
                <ResponsiveImage
                  image={service.page.image}
                  sizes="(min-width: 56rem) 39rem, 100vw"
                />
              </Reveal>
              <Reveal className="feature__body" delay={1}>
                <p className="eyebrow">{service.page.eyebrow}</p>
                <h2 className="h2" id={`${service.key}-title`}>
                  {service.page.title}
                </h2>
                <p className="lede">{service.page.lede}</p>
                <ul className="offers">
                  {service.page.offerings.map((offer) => (
                    <li key={offer.num}>
                      <span className="num">{offer.num}</span>
                      <h3>{offer.title}</h3>
                      <p>{offer.body}</p>
                    </li>
                  ))}
                </ul>
                {service.page.quoteHref ? (
                  <Link className="btn" to={service.page.quoteHref}>
                    {service.page.quoteLabel}
                  </Link>
                ) : null}
                {service.page.note ? <p className="note">{service.page.note}</p> : null}
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="band" aria-labelledby="dispatch-title">
        <div className="container band__grid">
          <Reveal>
            <p className="eyebrow">Dispatch · 24/7</p>
            <h2 className="h2" id="dispatch-title">
              One Dispatch Team Ties It All Together.
            </h2>
            <p className="lede">
              Cameras and patrol vehicles report to the same dispatch team, around the clock. That means
              one picture of your site and one number to call.
            </p>
          </Reveal>
          <Reveal className="frame" delay={1}>
            <ResponsiveImage image={images.controlRoom} sizes="(min-width: 56rem) 44rem, 100vw" />
          </Reveal>
        </div>
      </section>

      <Cta />
    </>
  );
}
