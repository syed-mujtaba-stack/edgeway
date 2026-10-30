import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { company } from "@/data/site";
import type { BusinessSettings } from "@/types/db";
import { repo } from "@/lib/repo";

const fallbackSettings: BusinessSettings = {
  phoneDisplay: company.phoneDisplay,
  phoneHref: company.phoneHref,
  email: company.email,
  addressLine1: company.address.line1,
  addressLine2: company.address.line2,
  ppo: company.ppo,
  notifyEmail: company.email,
};

const SiteSettingsContext = createContext<BusinessSettings>(fallbackSettings);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettings>(fallbackSettings);

  useEffect(() => {
    repo()
      .getSettings()
      .then((next) => setSettings({ ...fallbackSettings, ...next }))
      .catch(() => setSettings(fallbackSettings));
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteCompany() {
  const settings = useContext(SiteSettingsContext);

  return useMemo(
    () => ({
      ...company,
      ppo: settings.ppo || company.ppo,
      phoneDisplay: settings.phoneDisplay || company.phoneDisplay,
      phoneHref: settings.phoneHref || company.phoneHref,
      email: settings.email || company.email,
      emailHref: settings.email ? `mailto:${settings.email}` : company.emailHref,
      address: {
        ...company.address,
        line1: settings.addressLine1 || company.address.line1,
        line2: settings.addressLine2 || company.address.line2,
      },
    }),
    [settings],
  );
}
