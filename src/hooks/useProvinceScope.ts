import { useEffect, useState } from "react";
import {
  canSelectAllProvinces,
  ensureUserProvince,
  filterProvincesForUser,
  getDefaultProvinceFilter,
  getUserSession,
  guardProvinceFilter,
  type ProvinceItem,
  type UserSession,
} from "@/config/app";

export function useProvinceScope() {
  const [session, setSession] = useState<UserSession | null>(() => getUserSession());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const user = (await ensureUserProvince()) ?? getUserSession();
      setSession(user);
      setReady(true);
    })();
  }, []);

  const canSelectAll = session ? canSelectAllProvinces(session.role) : false;
  const defaultFilter = getDefaultProvinceFilter(session);
  const provinceId = canSelectAll ? null : (session?.province_id ?? null);
  const provinceNom = canSelectAll ? null : (session?.province_nom ?? null);

  return {
    session,
    ready,
    canSelectAll,
    defaultFilter,
    provinceId,
    provinceNom,
    filterProvinces: (provinces: ProvinceItem[]) =>
      filterProvincesForUser(provinces, session),
    guardFilter: (value: string) => guardProvinceFilter(value, session),
  };
}
