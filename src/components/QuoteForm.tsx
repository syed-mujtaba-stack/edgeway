import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  coverageTimings,
  quoteServices,
  siteTypeExtras,
  siteTypeGroups,
} from "@/data/site";
import { useSiteCompany } from "@/context/SiteSettings";
import { Arrow } from "@/components/primitives";
import { OfflineQueuedError, submitInquiry } from "@/lib/inquiries";

/**
 * Quote request form.
 *
 * No backend by default: it composes an email in the visitor's mail app,
 * exactly like the static site did. To POST it to a server instead, set
 * VITE_QUOTE_ENDPOINT (e.g. https://formspree.io/f/xxxx) and the form will
 * submit the fields as FormData and expect a 2xx response.
 */
const ENDPOINT = import.meta.env.VITE_QUOTE_ENDPOINT ?? "";

type Values = {
  name: string;
  company: string;
  email: string;
  phone: string;
  services: string[];
  site: string;
  timing: string;
  location: string;
  message: string;
};

type Field = "name" | "email" | "phone";

const emptyValues: Values = {
  name: "",
  company: "",
  email: "",
  phone: "",
  services: [],
  site: "",
  timing: "",
  location: "",
  message: "",
};

const messages: Record<Field, string> = {
  name: "Enter your name so we know who to reply to.",
  email: "Enter an email like name@company.com.",
  phone: "Enter a phone number we can reach you on, like (555) 123-4567.",
};

type Status = { tone: "ok" | "error"; node: React.ReactNode } | null;

export function QuoteForm() {
  const company = useSiteCompany();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  /** arriving from "Request Guards" etc. pre-selects that service */
  useEffect(() => {
    const wanted = searchParams.get("service");
    if (!wanted) return;
    const match = quoteServices.find((s) => s.key === wanted);
    if (match) {
      setValues((v) => (v.services.includes(match.value) ? v : { ...v, services: [...v.services, match.value] }));
    }
  }, [searchParams]);

  /** warn before leaving with unsent input */
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const setField = <K extends keyof Values>(key: K, value: Values[K]) => {
    setDirty(true);
    setValues((v) => ({ ...v, [key]: value }));
  };

  const validate = (): Field[] => {
    const bad: Field[] = [];
    const next: Partial<Record<Field, string>> = {};

    if (!values.name.trim()) {
      next.name = messages.name;
      bad.push("name");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = messages.email;
      bad.push("email");
    }
    if (values.phone.replace(/\D/g, "").length < 10) {
      next.phone = messages.phone;
      bad.push("phone");
    }

    setErrors(next);
    return bad;
  };

  const say = (tone: "ok" | "error", node: React.ReactNode) => {
    setStatus({ tone, node });
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    const bad = validate();
    if (bad.length) {
      const el = formRef.current?.elements.namedItem(bad[0]);
      if (el instanceof HTMLElement) el.focus();
      say("error", "Please fix the highlighted fields and try again.");
      return;
    }

    const services = values.services.length ? values.services.join(", ") : "Not sure yet";
    const quote = {
      name: values.name.trim(),
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      services,
      site: values.site || "Not specified",
      location: values.location.trim() || "Not specified",
      timing: values.timing || "Not specified",
      message: values.message.trim(),
    };

    if (ENDPOINT) {
      setBusy(true);
      try {
        const body = new FormData();
        Object.entries(quote).forEach(([k, v]) => body.append(k, v));
        const res = await fetch(ENDPOINT, {
          method: "POST",
          body,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(String(res.status));
        setDirty(false);
        setValues(emptyValues);
        say(
          "ok",
          <>
            <strong>Request received.</strong> Thank you, {quote.name.split(" ")[0]}. We’ll be in touch
            shortly. Need someone today? Call{" "}
            <a href={company.phoneHref}>(747)&nbsp;370-4640</a>.
          </>,
        );
      } catch {
        say(
          "error",
          <>
            We couldn’t send that just now. Please call <a href={company.phoneHref}>(747)&nbsp;370-4640</a>{" "}
            or email <a href={company.emailHref}>{company.email}</a>.
          </>,
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    /* Primary path: write the request to the backend so the admin dashboard
       receives it in real time (and pushes a notification). */
    const submissionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setBusy(true);
    try {
      await submitInquiry({
        name: quote.name,
        company: quote.company,
        email: quote.email,
        phone: quote.phone,
        services: values.services,
        siteType: values.site,
        timing: values.timing,
        location: values.location,
        message: quote.message,
        submissionId,
      });
      setDirty(false);
      setValues(emptyValues);
      say(
        "ok",
        <>
          <strong>Request received.</strong> Thank you, {quote.name.split(" ")[0]}. Our dispatch team
          has it now and will be in touch shortly. Need someone today? Call{" "}
          <a href={company.phoneHref}>(747)&nbsp;370-4640</a>.
        </>,
      );
    } catch (error) {
      if (error instanceof OfflineQueuedError) {
        setDirty(false);
        setValues(emptyValues);
        say(
          "ok",
          <>
            <strong>You’re offline — we saved your request.</strong> It will be sent automatically as
            soon as you’re back online. Need someone today? Call{" "}
            <a href={company.phoneHref}>(747)&nbsp;370-4640</a>.
          </>,
        );
      } else {
        /* Last resort: never lose a lead — fall back to the visitor's mail app. */
        const subject = `Quote request: ${quote.site} (${quote.name}${
          quote.company ? `, ${quote.company}` : ""
        })`;
        const lines = [`Name: ${quote.name}`];
        if (quote.company) lines.push(`Company: ${quote.company}`);
        lines.push(
          `Email: ${quote.email}`,
          `Phone: ${quote.phone}`,
          `Services: ${quote.services}`,
          `Site type: ${quote.site}`,
          `Location: ${quote.location}`,
          `Coverage needed: ${quote.timing}`,
          "",
          quote.message || "(No additional details)",
        );
        window.location.href = `${company.emailHref}?subject=${encodeURIComponent(
          subject,
        )}&body=${encodeURIComponent(lines.join("\n"))}`;
        setDirty(false);
        say(
          "ok",
          <>
            We couldn’t reach our server just now, so your email app should be open with the request
            filled in — just press send. Or call <a href={company.phoneHref}>(747)&nbsp;370-4640</a>.
          </>,
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleService = (value: string, checked: boolean) => {
    setDirty(true);
    setValues((v) => ({
      ...v,
      services: checked ? [...v.services, value] : v.services.filter((s) => s !== value),
    }));
  };

  const siteOptions = useMemo(
    () => siteTypeGroups.map((g) => ({ group: g.group, options: g.options })),
    [],
  );

  return (
    <form
      ref={formRef}
      className="form"
      onSubmit={onSubmit}
      noValidate
      action={company.emailHref}
      method="post"
      encType="text/plain"
    >
      <div className="form__row">
        <div className="field">
          <label htmlFor="f-name">Full Name</label>
          <input
            id="f-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith…"
            required
            aria-describedby="e-name"
            aria-invalid={errors.name ? "true" : "false"}
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => errors.name && validate()}
          />
          <span className="field__error" id="e-name" data-error-for="name">
            {errors.name ?? ""}
          </span>
        </div>
        <div className="field">
          <label htmlFor="f-company">
            Company <span className="opt">(optional)</span>
          </label>
          <input
            id="f-company"
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="Acme Properties…"
            value={values.company}
            onChange={(e) => setField("company", e.target.value)}
          />
        </div>
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="f-email">Email</label>
          <input
            id="f-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="jane@company.com…"
            required
            aria-describedby="e-email"
            aria-invalid={errors.email ? "true" : "false"}
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => errors.email && validate()}
          />
          <span className="field__error" id="e-email" data-error-for="email">
            {errors.email ?? ""}
          </span>
        </div>
        <div className="field">
          <label htmlFor="f-phone">Phone</label>
          <input
            id="f-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 123-4567…"
            required
            aria-describedby="e-phone"
            aria-invalid={errors.phone ? "true" : "false"}
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            onBlur={() => errors.phone && validate()}
          />
          <span className="field__error" id="e-phone" data-error-for="phone">
            {errors.phone ?? ""}
          </span>
        </div>
      </div>

      <fieldset className="field">
        <legend>
          What do you need? <span className="opt">(choose any)</span>
        </legend>
        <div className="chips">
          {quoteServices.map((service) => (
            <label className="chip" key={service.value}>
              <input
                type="checkbox"
                name="service"
                value={service.value}
                data-key={service.key}
                checked={values.services.includes(service.value)}
                onChange={(e) => toggleService(service.value, e.target.checked)}
              />
              <span>{service.value}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form__row">
        <div className="field">
          <label htmlFor="f-site">Site Type</label>
          <select
            id="f-site"
            name="site"
            value={values.site}
            onChange={(e) => setField("site", e.target.value)}
          >
            <option value="">Select…</option>
            {siteOptions.map((group) => (
              <optgroup label={group.group} key={group.group}>
                {group.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </optgroup>
            ))}
            {siteTypeExtras.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-timing">When Do You Need Coverage?</label>
          <select
            id="f-timing"
            name="timing"
            value={values.timing}
            onChange={(e) => setField("timing", e.target.value)}
          >
            <option value="">Select…</option>
            {coverageTimings.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-location">
          Site Location <span className="opt">(city)</span>
        </label>
        <input
          id="f-location"
          name="location"
          type="text"
          autoComplete="address-level2"
          placeholder="Los Angeles, CA…"
          value={values.location}
          onChange={(e) => setField("location", e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="f-message">
          Tell Us About Your Site <span className="opt">(optional)</span>
        </label>
        <textarea
          id="f-message"
          name="message"
          rows={5}
          placeholder="Hours, entry points, recent incidents, anything that helps…"
          value={values.message}
          onChange={(e) => setField("message", e.target.value)}
        />
      </div>

      <div className="form__foot">
        <div
          className="form-status"
          data-status=""
          data-tone={status?.tone}
          role="status"
          aria-live="polite"
          tabIndex={-1}
          ref={statusRef}
        >
          {status?.node}
        </div>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              Send Request
              <Arrow />
            </>
          )}
        </button>
        <p className="form__fine">
          Prefer to talk? Call <a href={company.phoneHref}>{company.phoneDisplay}</a> or email{" "}
          <a href={company.emailHref}>{company.email}</a>
        </p>
      </div>
    </form>
  );
}
