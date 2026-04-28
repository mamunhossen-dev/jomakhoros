import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAppSetting } from "@/hooks/useAppSetting";
import { DEFAULT_SITE, type SiteSettings } from "@/components/admin/SiteSettingsEditor";

const NotFound = () => {
  const location = useLocation();
  const { data } = useAppSetting<SiteSettings>('site_settings', DEFAULT_SITE);
  const c = { ...DEFAULT_SITE, ...(data ?? {}) };

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center px-4">
        <h1 className="mb-4 font-display text-6xl font-bold text-primary">{c.not_found_title}</h1>
        <p className="mb-6 text-lg text-muted-foreground">{c.not_found_message}</p>
        <Link to="/" className="inline-flex items-center text-primary underline hover:text-primary/90 font-medium">
          ← {c.not_found_back_label}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
