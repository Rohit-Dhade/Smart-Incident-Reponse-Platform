import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeIcon,
  LockIcon,
  MessageIcon,
  RadioIcon,
  ShieldIcon,
  UsersIcon,
} from "../components/Icons";
import { slugify } from "../format";
import { usePageTitle } from "../hooks/usePageTitle";

export function HomePage() {
  usePageTitle();
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = slugify(slug);
    if (!normalized) {
      setError("Enter an organization slug to open its status page.");
      return;
    }
    setError("");
    navigate(`/status/${normalized}`);
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <section className="hero">
          <div className="container hero__inner">
            <div className="hero__copy">
              <p className="eyebrow">Incident response + public status</p>
              <h1 className="hero__title">
                When systems break, keep everyone in the loop.
              </h1>
              <p className="hero__lede">
                Run the response, publish customer updates, and keep a public
                status page — from one incident timeline.
              </p>

              <form
                className="status-finder"
                onSubmit={handleSubmit}
                noValidate
              >
                <label className="field__label" htmlFor="org-slug">
                  Organization slug
                </label>
                <div className="status-finder__row">
                  <span className="status-finder__prefix" aria-hidden="true">
                    /status/
                  </span>
                  <input
                    id="org-slug"
                    className={`input status-finder__input ${
                      error ? "input--invalid" : ""
                    }`.trim()}
                    value={slug}
                    onChange={(event) => {
                      setSlug(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="acme-systems"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={error ? true : undefined}
                    aria-describedby="org-slug-message"
                  />
                  <button type="submit" className="btn btn--primary">
                    Open status page
                    <ArrowRightIcon size={16} />
                  </button>
                </div>
                <p
                  id="org-slug-message"
                  className={`field__message ${
                    error ? "field__message--error" : ""
                  }`.trim()}
                  role={error ? "alert" : undefined}
                >
                  {error ||
                    "Use the slug from your team's status page link, or try the organization name."}
                </p>
              </form>

              <p className="hero__switch">
                Setting up a new page?{" "}
                <Link to="/register">Create a workspace</Link>
                <span aria-hidden="true"> · </span>
                <Link to="/login">Sign in</Link>
              </p>
            </div>

            <div className="hero__visual" aria-hidden="true">
              <div className="product-diagram">
                <div className="product-diagram__ring product-diagram__ring--outer" />
                <div className="product-diagram__ring product-diagram__ring--inner" />
                <span className="product-diagram__orbit-dot product-diagram__orbit-dot--one" />
                <span className="product-diagram__orbit-dot product-diagram__orbit-dot--two" />

                <div className="product-diagram__core">
                  <span className="product-diagram__core-icon">
                    <ActivityIcon size={22} />
                  </span>
                  <span>Status page</span>
                </div>

                <div className="product-diagram__tile product-diagram__tile--one">
                  <span className="diagram-dot diagram-dot--blue" />
                  Incident opened
                </div>
                <div className="product-diagram__tile product-diagram__tile--two">
                  <span className="diagram-dot diagram-dot--amber" />
                  Internal note
                </div>
                <div className="product-diagram__tile product-diagram__tile--three">
                  <span className="diagram-dot diagram-dot--blue" />
                  Public update
                </div>
                <div className="product-diagram__tile product-diagram__tile--four">
                  <span className="diagram-dot diagram-dot--green" />
                  Resolved
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="facts-strip" aria-label="Platform capabilities">
          <div className="container facts-strip__inner">
            <div className="fact">
              <span className="fact__icon" aria-hidden="true">
                <MessageIcon size={18} />
              </span>
              <div>
                <span className="fact__title">Public and internal updates</span>
                <span className="fact__text">One incident, two audiences.</span>
              </div>
            </div>
            <div className="fact">
              <span className="fact__icon" aria-hidden="true">
                <LockIcon size={18} />
              </span>
              <div>
                <span className="fact__title">Role-based access</span>
                <span className="fact__text">
                  Admin, responder, and viewer roles.
                </span>
              </div>
            </div>
            <div className="fact">
              <span className="fact__icon" aria-hidden="true">
                <RadioIcon size={18} />
              </span>
              <div>
                <span className="fact__title">Live status</span>
                <span className="fact__text">
                  Updates pushed without a refresh.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--muted" id="features">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Built into every incident</p>
              <h2 className="section-heading__title">
                The response and the message, in one place.
              </h2>
              <p className="section-heading__lede">
                StatusDesk keeps the working record and the customer-facing
                update on the same timeline, so nobody has to reconstruct what
                happened later.
              </p>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <span className="feature-card__icon" aria-hidden="true">
                  <ActivityIcon size={20} />
                </span>
                <h3>One timeline for the whole response</h3>
                <p>
                  Open an incident, change status, assign responders, and post
                  notes. Every action is recorded in order.
                </p>
              </article>
              <article className="feature-card">
                <span className="feature-card__icon" aria-hidden="true">
                  <GlobeIcon size={20} />
                </span>
                <h3>Updates customers can actually see</h3>
                <p>
                  Publish selected updates to your status page while keeping
                  internal notes private to the workspace.
                </p>
              </article>
              <article className="feature-card">
                <span className="feature-card__icon" aria-hidden="true">
                  <ShieldIcon size={20} />
                </span>
                <h3>Postmortems from the real timeline</h3>
                <p>
                  Draft a postmortem once the incident is resolved, using the
                  updates your team already wrote.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--dark">
          <div className="container dark-grid">
            <div className="dark-grid__copy">
              <p className="eyebrow eyebrow--on-dark">How it works</p>
              <h2 className="section-heading__title section-heading__title--on-dark">
                From first alert to published postmortem.
              </h2>
              <p className="dark-grid__lede">
                The public page is not a separate tool to maintain. It is a view
                of the incident work your team is already doing.
              </p>
              <div className="dark-benefits">
                <div className="dark-benefit">
                  <ClockIcon size={18} />
                  <span>Every update is timestamped and attributed.</span>
                </div>
                <div className="dark-benefit">
                  <UsersIcon size={18} />
                  <span>Responders see the full record; viewers see what matters.</span>
                </div>
                <div className="dark-benefit">
                  <CheckCircleIcon size={18} />
                  <span>Resolve the incident and close the loop.</span>
                </div>
              </div>
            </div>

            <ol className="process">
              <li className="process__step">
                <span className="process__number">01</span>
                <div>
                  <h3>Declare the incident</h3>
                  <p>
                    Choose the affected service and severity. The service status
                    changes immediately.
                  </p>
                </div>
              </li>
              <li className="process__step">
                <span className="process__number">02</span>
                <div>
                  <h3>Keep everyone aligned</h3>
                  <p>
                    Post internal notes and public updates. Customers get the
                    message without the noise.
                  </p>
                </div>
              </li>
              <li className="process__step">
                <span className="process__number">03</span>
                <div>
                  <h3>Close the loop</h3>
                  <p>
                    Resolve the incident, restore service health, and turn the
                    timeline into a postmortem.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
