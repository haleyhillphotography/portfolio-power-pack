import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";

interface ImageConfig {
  id: string;
  file: string;
}

interface ProjectConfig {
  project: string;
  city: string;
  launchEnd?: string;
  images: ImageConfig[];
}

interface Tier {
  name: string;
  count: number;
  capacity: number;
  hasBonus: boolean;
  regularPrice: number;
  launchPrice: number;
  label?: string;
}

const TIERS: Tier[] = [
  { name: "3 Image Pack", count: 3, capacity: 3, hasBonus: false, regularPrice: 695, launchPrice: 645 },
  { name: "5 Image Pack", count: 5, capacity: 6, hasBonus: true, regularPrice: 1095, launchPrice: 995, label: "Most Popular" },
  { name: "8 Image Pack", count: 8, capacity: 9, hasBonus: true, regularPrice: 1495, launchPrice: 1295 },
];

const GOLD = "#CB9B4B";

const STEPS = [
  {
    step: 1,
    title: "Send Your Selections",
    color: GOLD,
    description: "Browse through your photos above and select your favorites by clicking the checkbox. Then click 'Get My Photos' to send us your selections via email.",
  },
  {
    step: 2,
    title: "Pay Online",
    color: "#ccc",
    description: "Once we receive your selections, we'll send you a secure invoice to pay online.",
  },
  {
    step: 3,
    title: "Download Your Images",
    color: "#ccc",
    description: "After payment, you'll receive an email with a Dropbox link to directly download the high-resolution images you selected.",
  },
];

function getAutoTierIndex(selectedCount: number): number | null {
  if (selectedCount === 0) return null;
  if (selectedCount <= 3) return 0;
  if (selectedCount <= 6) return 1;
  if (selectedCount <= 9) return 2;
  return null;
}

function useCountdown(launchEnd?: string) {
  const endTime = launchEnd ? new Date(launchEnd + "T23:59:59").getTime() : null;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime) return null;

  const diff = Math.max(0, endTime - now);
  if (diff === 0) return "ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export default function ProjectPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [lightboxImage, setLightboxImage] = useState<ImageConfig | null>(null);
  const [bonusPopup, setBonusPopup] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseAgreed, setLicenseAgreed] = useState(false);
  const bonusShownFor = useRef<Set<number>>(new Set());

  const countdown = useCountdown(config?.launchEnd);

  useEffect(() => {
    if (!projectSlug) return;
    fetch(`/projects/${projectSlug}/config.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Config not found");
        return res.json();
      })
      .then((data: ProjectConfig) => setConfig(data))
      .catch((err) => setError(err.message));
  }, [projectSlug]);

  const toggleImage = useCallback((id: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedCount = selectedImages.size;

  useEffect(() => {
    if (selectedCount < 5) {
      bonusShownFor.current.delete(5);
    }
    if (selectedCount === 5 && !bonusShownFor.current.has(5)) {
      bonusShownFor.current.add(5);
      setBonusPopup("FREE image unlocked!");
      const timer = setTimeout(() => setBonusPopup(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [selectedCount]);

  useEffect(() => {
    if (!lightboxImage) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxImage(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxImage]);

  if (error) return <div style={{ padding: 40, textAlign: "center" }} data-testid="text-error">{error}</div>;
  if (!config) return <div style={{ padding: 40, textAlign: "center" }} data-testid="text-loading">Loading...</div>;

  const isOverflow = selectedCount > 9;
  const autoTierIndex = getAutoTierIndex(selectedCount);
  const activeTierIndex = autoTierIndex;
  const activeTier = activeTierIndex !== null ? TIERS[activeTierIndex] : null;

  const bonusEarned = activeTier?.hasBonus && selectedCount >= activeTier.count;
  const totalImages = activeTier ? (bonusEarned ? activeTier.count + 1 : activeTier.count) : 0;

  let nudgeMessage = "";
  if (activeTier && !isOverflow) {
    if (activeTier.hasBonus && selectedCount < activeTier.count) {
      const more = activeTier.count - selectedCount;
      nudgeMessage = `Select ${more} more to unlock your free bonus image`;
    } else {
      const remaining = activeTier.capacity - selectedCount;
      if (remaining > 0) {
        nudgeMessage = `You can select ${remaining} more images with this pack`;
      }
    }
  }

  const showUpsellBanner = selectedCount >= 1 && selectedCount <= 4 && !isOverflow;
  const upsellMore = 5 - selectedCount;

  const selectedIds = Array.from(selectedImages);

  const mailtoSubject = isOverflow
    ? `Custom Quote Request — ${config.project}`
    : `Photo Selections — ${config.project}`;
  const mailtoBody = isOverflow
    ? `Hi Haley,\n\nI selected ${selectedCount} images from the ${config.project} project and would like a custom quote.\n\nSelected Images: ${selectedIds.join(", ")}\n\nThank you!`
    : `Hi Haley,\n\nI'd like to purchase the ${activeTier?.name || ""} for the ${config.project} project.\n\nSelected Images: ${selectedIds.join(", ")}\n\nThank you!`;
  const mailtoHref = `mailto:haley@haleyhillphotography.com?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

  const customQuoteMailto = `mailto:haley@haleyhillphotography.com?subject=${encodeURIComponent(`Custom Quote Request — ${config.project}`)}&body=${encodeURIComponent(`Hi Haley,\n\nI'm interested in a custom quote for the ${config.project} project.\n\nThank you!`)}`;

  const headingStyle: React.CSSProperties = {
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    fontWeight: 700,
  };

  const checkboxStyle = (isSelected: boolean): React.CSSProperties => ({
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: isSelected ? GOLD : "rgba(255,255,255,0.85)",
    border: isSelected ? `2px solid ${GOLD}` : "2px solid rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: isSelected ? "#fff" : "transparent",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    zIndex: 2,
  });

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif", background: "#fff", color: "#222" }}>

      {/* STICKY SELECTION COUNTER + BONUS + NUDGE + CLEAR */}
      {selectedCount > 0 && (
        <div data-testid="sticky-counter" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9000,
          background: "rgba(255,255,255,0.95)",
          borderBottom: "1px solid #e5e5e5",
          padding: "8px 20px",
          textAlign: "center",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <span style={{
            display: "inline-block",
            background: GOLD,
            color: "#fff",
            borderRadius: 999,
            padding: "4px 16px",
            fontSize: 13,
            fontWeight: 600,
          }}>
            {selectedCount} Selected
          </span>
          {bonusPopup && (
            <span data-testid="bonus-popup" style={{
              display: "inline-block",
              background: "#d3e6f0",
              color: "#2a6a8a",
              borderRadius: 999,
              padding: "6px 20px",
              fontSize: 15,
              fontWeight: 700,
              fontStyle: "italic",
            }}>
              FREE image unlocked!
            </span>
          )}
          {nudgeMessage && !bonusPopup && (
            <span data-testid="sticky-nudge" style={{
              fontSize: 13,
              color: GOLD,
              fontWeight: 500,
            }}>
              {nudgeMessage}
            </span>
          )}
          <button
            data-testid="button-clear-selections"
            onClick={() => { setSelectedImages(new Set()); bonusShownFor.current.clear(); setBonusPopup(null); }}
            style={{
              background: "none",
              border: "none",
              color: "#aaa",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
              textDecoration: "underline",
              padding: "2px 4px",
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* HERO */}
      <section data-testid="section-hero" style={{ textAlign: "center", padding: selectedCount > 0 ? "80px 20px 16px" : "60px 20px 16px" }}>
        <img src="/logo.png" alt="Logo" style={{ height: 48, margin: "0 auto 24px" }} data-testid="img-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <h1 style={{ fontSize: 42, fontWeight: 700, ...headingStyle, margin: "0 0 8px" }} data-testid="text-project-name">{config.project}</h1>
        <p style={{ fontSize: 16, color: "#888", margin: "0 0 24px" }} data-testid="text-city">{config.city}</p>
        {countdown && countdown !== "ended" && (
          <div data-testid="badge-countdown" style={{
            display: "inline-block",
            background: GOLD,
            color: "#fff",
            borderRadius: 999,
            padding: "8px 24px",
            fontSize: 14,
            fontWeight: 600,
          }}>
            LAUNCH PRICING ENDS IN {countdown}
          </div>
        )}
        {countdown === "ended" && (
          <div data-testid="badge-countdown-ended" style={{
            display: "inline-block",
            background: "#999",
            color: "#fff",
            borderRadius: 999,
            padding: "8px 24px",
            fontSize: 14,
            fontWeight: 600,
          }}>
            LAUNCH PRICING HAS ENDED
          </div>
        )}
      </section>

      {/* IMAGE GALLERY */}
      <section data-testid="section-gallery" style={{ maxWidth: 960, margin: "0 auto", padding: "20px 20px 40px" }}>
        <h2 style={{ ...headingStyle, fontSize: 20, textAlign: "center", marginBottom: 20 }}>SELECT YOUR FAVORITES</h2>

        <div data-testid="gallery-scroll-container" style={{
          maxHeight: "60vh",
          overflowY: "auto",
          position: "relative",
          borderRadius: 8,
        }}>
          {/* UPSELL BANNER - sticky inside scroll container */}
          {showUpsellBanner && (
            <div data-testid="upsell-banner" style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              textAlign: "center",
              padding: "10px 20px",
              border: `2px solid ${GOLD}`,
              borderRadius: 8,
              background: "#fdf8ef",
              maxWidth: 480,
              margin: "0 auto 16px",
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: GOLD, margin: 0 }}>
                Select {upsellMore} more favorite{upsellMore !== 1 ? "s" : ""} to unlock a FREE bonus image!
              </p>
            </div>
          )}

          <div data-testid="gallery-grid" style={{
            columnCount: 3,
            columnGap: 16,
          }}>
            {config.images.map((img) => {
              const isSelected = selectedImages.has(img.id);
              return (
                <div
                  key={img.id}
                  data-testid={`card-image-${img.id}`}
                  onClick={() => setLightboxImage(img)}
                  style={{
                    position: "relative",
                    borderRadius: 8,
                    overflow: "hidden",
                    cursor: "pointer",
                    border: isSelected ? `3px solid ${GOLD}` : "3px solid transparent",
                    breakInside: "avoid",
                    marginBottom: 16,
                  }}
                >
                  <img
                    src={`/projects/${projectSlug}/${img.file}`}
                    alt={img.id}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                  <div
                    data-testid={`checkbox-image-${img.id}`}
                    onClick={(e) => { e.stopPropagation(); toggleImage(img.id); }}
                    style={checkboxStyle(isSelected)}
                  >
                    ✓
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section data-testid="section-pricing" style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px" }}>
        <h2 style={{ ...headingStyle, fontSize: 20, textAlign: "center", marginBottom: 4 }}>PORTFOLIO POWER PACK PRICING</h2>
        <p style={{ textAlign: "center", fontSize: 12, color: "#888", ...headingStyle, marginBottom: 44 }}>USE ANYWHERE. FOREVER.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {TIERS.map((tier, i) => {
            const isActive = activeTierIndex === i;
            return (
              <div
                key={tier.name}
                data-testid={`card-tier-${i}`}
                style={{
                  position: "relative",
                  border: isActive ? `2px solid ${GOLD}` : "2px solid #e5e5e5",
                  borderRadius: 8,
                  padding: "28px 20px",
                  textAlign: "center",
                }}
              >
                {tier.label && (
                  <div style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: GOLD,
                    color: "#fff",
                    borderRadius: 999,
                    padding: "2px 14px",
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}>
                    {tier.label}
                  </div>
                )}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: GOLD,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                    ✓
                  </div>
                )}
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{tier.name}</h3>
                <p style={{ fontSize: 14, color: "#999", textDecoration: "line-through", marginBottom: 4 }}>
                  ${tier.regularPrice.toLocaleString()}
                </p>
                <p style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                  ${tier.launchPrice.toLocaleString()}
                </p>
                <p style={{ fontSize: 11, color: GOLD, fontWeight: 600, ...headingStyle, marginBottom: 12 }}>LAUNCH RATE</p>
                {tier.hasBonus && (
                  <div data-testid={`badge-bonus-${i}`} style={{
                    display: "inline-block",
                    background: "#f5f0e6",
                    color: GOLD,
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    +1 Free Image within 72hrs
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p data-testid="text-custom-quote-link" style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
          Need more images?{" "}
          <a
            href={customQuoteMailto}
            style={{ color: GOLD, fontWeight: 600, textDecoration: "none" }}
          >
            Get a Custom Quote →
          </a>
        </p>
      </section>

      {/* YOUR SELECTION + CTA */}
      <section data-testid="section-cta" style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div data-testid="card-selection-summary" style={{ border: "2px solid #e5e5e5", borderRadius: 8, padding: 28 }}>
            <h3 style={{ ...headingStyle, fontSize: 16, marginBottom: 20 }}>YOUR SELECTION</h3>
            <div style={{ fontSize: 14, lineHeight: 2.2 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Package</span>
                <span style={{ fontWeight: 600 }}>{isOverflow ? "Custom Quote" : (activeTier?.name || "—")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Favorites</span>
                <span style={{ fontWeight: 600 }}>{selectedCount}</span>
              </div>
              {activeTier?.hasBonus && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>Bonus</span>
                  <span style={{ fontWeight: 600, color: bonusEarned ? GOLD : "#ccc" }}>
                    {bonusEarned ? "+1 Free" : "+1 Free (locked)"}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Total Images</span>
                <span style={{ fontWeight: 600 }}>{isOverflow ? selectedCount : totalImages}</span>
              </div>
            </div>
            {nudgeMessage && (
              <p data-testid="text-nudge" style={{ marginTop: 16, fontSize: 13, color: GOLD, fontWeight: 500 }}>
                {nudgeMessage}
              </p>
            )}
          </div>

          <div data-testid="card-cta" style={{
            background: GOLD,
            borderRadius: 8,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}>
            {isOverflow ? (
              <>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Custom Quote</p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginBottom: 20 }}>
                  {selectedCount} images selected
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
                  {activeTier ? `$${activeTier.launchPrice.toLocaleString()}` : "$0"}
                </p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginBottom: 20 }}>
                  {totalImages} image{totalImages !== 1 ? "s" : ""}
                </p>
              </>
            )}
            <button
              data-testid="button-get-photos"
              onClick={() => { setLicenseAgreed(false); setShowLicenseModal(true); }}
              style={{
                display: "inline-block",
                background: "#fff",
                color: GOLD,
                borderRadius: 4,
                padding: "12px 32px",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                ...headingStyle,
              }}
            >
              {isOverflow ? "REQUEST QUOTE" : "GET MY PHOTOS"}
            </button>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontStyle: "italic", marginTop: 16, maxWidth: 260 }}>
              You won't be charged yet. This sends your selections so we can get you an invoice.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section data-testid="section-how-it-works" style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
        <h2 style={{ ...headingStyle, fontSize: 20, marginBottom: 32 }}>HOW IT WORKS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {STEPS.map((s) => {
            const isExpanded = expandedStep === s.step;
            return (
              <div
                key={s.step}
                data-testid={`card-step-${s.step}`}
                onClick={() => setExpandedStep(isExpanded ? null : s.step)}
                style={{
                  background: isExpanded ? "#d3e6f0" : "transparent",
                  borderRadius: 12,
                  padding: "20px 16px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <div
                  data-testid={`button-step-${s.step}`}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: isExpanded ? GOLD : s.color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 700,
                    margin: "0 auto 12px",
                    border: "3px solid transparent",
                  }}
                >
                  {s.step}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</p>
                {isExpanded && (
                  <div data-testid={`text-step-desc-${s.step}`} style={{
                    marginTop: 12,
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.7)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#555",
                    lineHeight: 1.6,
                    textAlign: "left",
                  }}>
                    {s.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer data-testid="section-footer" style={{ textAlign: "center", padding: "40px 20px", fontSize: 13, color: "#aaa" }}>
        &copy; Haley Hill Photography
      </footer>

      {/* LICENSING AGREEMENT MODAL */}
      {showLicenseModal && (
        <div
          data-testid="license-modal-overlay"
          onClick={() => setShowLicenseModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            data-testid="license-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "32px 28px",
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ ...headingStyle, fontSize: 18, marginBottom: 20, textAlign: "center" }}>Licensing Agreement</h3>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#333" }}>By purchasing, you agree to the following:</p>
            <ul style={{ fontSize: 13, color: "#555", lineHeight: 1.8, paddingLeft: 20, marginBottom: 20 }}>
              <li>Your license is non-exclusive and for your company's use only. Images may not be shared with or used by any other company without their own license.</li>
              <li>Images may not be sold, significantly altered, used in a derogatory manner, or incorporated into a trademark or logo.</li>
              <li>All images remain the property of Haley Hill Photography.</li>
              <li>Payment must be received in full before images are delivered.</li>
            </ul>
            <label
              data-testid="checkbox-license-agree"
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 24, fontSize: 14 }}
            >
              <input
                type="checkbox"
                checked={licenseAgreed}
                onChange={(e) => setLicenseAgreed(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: GOLD, cursor: "pointer" }}
              />
              <span style={{ fontWeight: 600, color: "#333" }}>I agree to the licensing terms</span>
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                data-testid="button-license-cancel"
                onClick={() => setShowLicenseModal(false)}
                style={{
                  flex: 1,
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: "2px solid #e5e5e5",
                  background: "#fff",
                  color: "#888",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                data-testid="button-license-continue"
                disabled={!licenseAgreed}
                onClick={() => {
                  setShowLicenseModal(false);
                  window.location.href = mailtoHref;
                }}
                style={{
                  flex: 1,
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: licenseAgreed ? GOLD : "#ccc",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: licenseAgreed ? "pointer" : "not-allowed",
                  ...headingStyle,
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          data-testid="lightbox-overlay"
          onClick={() => setLightboxImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
          >
            <img
              data-testid="lightbox-image"
              src={`/projects/${projectSlug}/${lightboxImage.file}`}
              alt={lightboxImage.id}
              style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 4 }}
            />
            <button
              data-testid="button-lightbox-close"
              onClick={() => setLightboxImage(null)}
              style={{
                position: "absolute",
                top: -16,
                right: -16,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#fff",
                border: "none",
                fontSize: 20,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#333",
              }}
            >
              ✕
            </button>
            <div
              data-testid={`checkbox-lightbox-${lightboxImage.id}`}
              onClick={() => toggleImage(lightboxImage.id)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: selectedImages.has(lightboxImage.id) ? GOLD : "rgba(255,255,255,0.85)",
                border: selectedImages.has(lightboxImage.id) ? `2px solid ${GOLD}` : "2px solid rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: selectedImages.has(lightboxImage.id) ? "#fff" : "transparent",
                fontSize: 20,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✓
            </div>
          </div>
        </div>
      )}

      {/* RESPONSIVE STYLES */}
      <style>{`
        @media (max-width: 768px) {
          [data-testid="gallery-grid"] {
            column-count: 1 !important;
          }
          [data-testid="section-pricing"] > div:nth-child(3) {
            grid-template-columns: 1fr !important;
          }
          [data-testid="section-cta"] > div {
            grid-template-columns: 1fr !important;
          }
          [data-testid="section-how-it-works"] > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
