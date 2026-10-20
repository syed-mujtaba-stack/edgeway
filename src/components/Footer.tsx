import { Link } from "react-router-dom";
import { company, images } from "@/data/site";
import { ResponsiveImage } from "@/components/primitives";

const serviceLinks = [
  { label: "Security Guards", to: "/services#guards" },
  { label: "Cameras", to: "/services#cameras" },
  { label: "Vehicle Patrol", to: "/services#patrol" },
];

const companyLinks = [
  { label: "Industries", to: "/industries" },
  { label: "FAQ", to: "/contact#faq" },
  { label: "Request a Quote", to: "/contact#quote" },
];

export function Footer() {
  return (
    <footer className="footer on-dark">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Link className="brand" to="/" aria-label={`${company.name}, ${company.ppo}, home`}>
              <ResponsiveImage image={images.crest} />
              <span className="brand__name" translate="no">
                Edgeway<span>Security Inc.</span>
                <span className="brand__lic">{company.ppo}</span>
              </span>
            </Link>
            <p className="footer__tag">
              Guards, cameras and vehicle patrol
              <br />
              We got you covered.
            </p>
          </div>

          <div>
            <h2>Services</h2>
            <ul>
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Company</h2>
            <ul>
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Contact</h2>
            <ul>
              <li>
                <a href={company.phoneHref}>{company.phoneDisplay}</a>
              </li>
              <li>
                <a href={company.emailHref}>{company.email}</a>
              </li>
              {/* TODO: replace with the real street address */}
              <li>
                <span className="placeholder">
                  {company.address.line1}, {company.address.line2}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            © <span>{new Date().getFullYear()}</span>{" "}
            <span translate="no">{company.name}</span> All rights reserved.
          </p>
          <p>Licensed &amp; insured · {company.serviceArea}</p>
        </div>
      </div>
    </footer>
  );
}
