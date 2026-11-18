import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Result from "./pages/Result";
import Search from "./pages/Search";
import Explore from "./pages/Explore";
import SpeciesPage from "./pages/SpeciesPage";
import Settings from "./pages/Settings";

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="mx-auto min-h-dvh max-w-3xl pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/scan/:id" element={<Result />} />
          <Route path="/search" element={<Search />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/species/:id" element={<SpeciesPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
