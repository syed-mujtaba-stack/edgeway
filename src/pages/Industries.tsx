import { images, sectors } from "@/data/site";
import { Seo } from "@/lib/seo";
import { ResponsiveImage, Reveal } from "@/components/primitives";
import { Cta } from "@/components/Cta";

export function Industries() {
  return (
    <>
      <Seo
        title="Industries We Serve | Edgeway Security Inc."
        description="Security for stores, shopping centers, plazas, construction sites, warehouses, dams, schools, hospitals and government sites across California."
      />

      <section className="page-hero" aria-labelledby="page-title">
        <div className="container">
          <div className="page-hero__grid">
            <Reveal>
              <p className="eyebrow">Industries</p>
              <h1 className="h1" id="page-title">
                From School Campuses to Critical Infrastructure.
              </h1>
            </Reveal>
            <Reveal as="p" className="lede" delay={1}>
              Every industry carries different risks. We tailor staffing, cameras and patrols to match
              the site in front of us.
            </Reveal>
          </div>

          <Reveal as="nav" className="jump" delay={2} aria-label="Jump to a sector">
            {sectors.map((sector) => (
              <a key={sector.id} href={`#${sector.id}`}>
                {sector.jumpLabel}
              </a>
            ))}
          </Reveal>
        </div>
      </section>

      <Reveal className="container">
        <div className="frame wide-media">
          <ResponsiveImage image={images.nightPatrol} sizes="(min-width: 85rem) 78rem, 100vw" priority />
        </div>
      </Reveal>

      <section className="section" aria-label="Sectors">
        <div className="container">
          {sectors.map((sector) => (
            <div className="sector" id={sector.id} key={sector.id}>
              <Reveal className="sector__intro">
                <p className="eyebrow">{sector.eyebrow}</p>
                <h2 className="h2">{sector.title}</h2>
                <p className="lede">{sector.lede}</p>
                {sector.image ? (
                  <div className="frame">
                    <ResponsiveImage image={sector.image} sizes="(min-width: 56rem) 30rem, 100vw" />
                  </div>
                ) : null}
              </Reveal>

              <Reveal as="ul" className="sector__list" delay={1}>
                {sector.items.map((item) => (
                  <li key={item.num}>
                    <span className="num">{item.num}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <ul className="tags" aria-label="Typical coverage">
                      {item.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      <Cta />
    </>
  );
}
