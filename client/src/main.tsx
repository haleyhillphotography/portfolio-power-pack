import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProjectPage from "./pages/project-page";
import "./index.css";

function Home() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif", color: "#666" }}>
      <p data-testid="text-home-message">Append a project slug to the URL</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:projectSlug" element={<ProjectPage />} />
    </Routes>
  </BrowserRouter>
);
