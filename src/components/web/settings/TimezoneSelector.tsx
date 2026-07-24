import { useTranslation } from "react-i18next";

import { useAppStore } from "@/stores/useAppStore";

export default function TimezoneSelector() {
  const { user, updateUser } = useAppStore();
  const { t } = useTranslation();
  // @ts-expect-error supportedValuesOf is available in modern browsers but absent from the ES2020 typings.
  const zones = Intl.supportedValuesOf("timeZone");

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateUser({ timeZone: e.target.value });
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-500">{t("settings.timezone")}</label>
      <select className="mt-1 rounded border p-2" value={user!.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone} onChange={handleChange}>
        {zones.map((tz: string) => <option key={tz} value={tz}>{tz}</option>)}
      </select>
    </div>
  );
}
