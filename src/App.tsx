import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { Services } from "@/pages/Services";
import { Industries } from "@/pages/Industries";
import { Contact } from "@/pages/Contact";
import { NotFound } from "@/pages/NotFound";

/* The dashboard is only downloaded when someone actually opens /admin, so the
   public site keeps the same small bundle it had before. */
const AdminApp = lazy(() =>
  import("@/admin/AdminApp").then((module) => ({ default: module.AdminApp })),
);

export function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
            <AdminApp />
          </Suspense>
        }
      />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/industries" element={<Industries />} />
        <Route path="/contact" element={<Contact />} />
        {/* the original static site's URL — keep it working */}
        <Route path="/index.html" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
