import { useEffect, useState } from "react";

// < 768px được coi là điện thoại
export function useIsMobile(bp = 768): boolean {
  const get = () => typeof window !== "undefined" && window.innerWidth < bp;
  const [mob, setMob] = useState(get);
  useEffect(() => {
    const on = () => setMob(get());
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("orientationchange", on);
    };
  }, []);
  return mob;
}
