import { Navbar } from "../components/layout/Navbar";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { CatalogueProvider } from "../features/catalogue/CatalogueProvider";
import { SearchProvider } from "../features/search/SearchProvider";

export function App() {
  const location = useLocation();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
      else window.scrollTo({ top: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);
  return (
    <CatalogueProvider><SearchProvider>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <div className="app-content"><Outlet /></div>
    </SearchProvider></CatalogueProvider>
  );
}
