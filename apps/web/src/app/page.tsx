"use client";
import styles from "./page.module.css";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";

type Tier = { name: string; price: number; perks: string[] };

export default function Page() {
  const { ready, authenticated, login, logout } = usePrivy();
  const [raised] = useState(12500); // USD placeholder
  const goal = 50000; // USD placeholder
  const progress = Math.min(100, Math.round((raised / goal) * 100));

  const tiers: Tier[] = [
    { name: "Basic", price: 25, perks: ["Early access stream", "Community role"] },
    { name: "Pro", price: 99, perks: ["720p download", "Behind-the-scenes", "Community role"] },
    { name: "VIP", price: 249, perks: ["4K download", "Credits mention", "VIP chat"] },
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  const onBuyClick = (tier: Tier) => {
    setSelectedTier(tier);
    if (!authenticated) {
      login();
      return;
    }
    setModalOpen(true);
  };

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>MovieCook</h1>
          <p className={styles.subtitle}>Stacked AI hardware to generate feature-length films in real time. Get your access pass to the first live demo on Bankshot.</p>
          <div className={styles.ctaRow}>
            <button className={styles.primaryCta} disabled={!ready} onClick={() => (authenticated ? logout() : login())}>
              {authenticated ? "Connected" : "Connect with Privy"}
            </button>
            <button className={styles.btnRed}>Red</button>
            <button className={styles.btnGreen}>Green</button>
            <button className={styles.btnBlue}>Blue</button>
          </div>
        </div>
        <div className={styles.heroMedia}>
          <Image src="/moviecook.jpg" alt="MovieCook" width={960} height={540} className={styles.heroImage} />
        </div>
      </section>

      <section className={styles.productSection}>
        <h2>Get your access pass</h2>
        <p className={styles.muted}>Early supporters unlock exclusive access. On-chain purchase will be enabled when the program is live.</p>

        <div className={styles.progress}>
          <div className={styles.progressMeta}>
            <span>${'{'}raised.toLocaleString(){'}'}</span>
            <span>of ${'{'}goal.toLocaleString(){'}'} goal</span>
            <span>{progress}% funded</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${'{'}progress{'}'}%` }} />
          </div>
        </div>

        <div className={styles.tiersGrid}>
          {tiers.map((tier) => (
            <div className={styles.card} key={tier.name}>
              <div className={styles.cardHeader}>
                <h3>{tier.name}</h3>
                <div className={styles.cardPrice}>${'{'}tier.price{'}'}</div>
              </div>
              <ul className={styles.perks}>
                {tier.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <button className={styles.primaryCta} onClick={() => onBuyClick(tier)}>
                Buy {tier.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {modalOpen && selectedTier && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Checkout (placeholder)</h3>
            <p>
              Tier: <strong>{selectedTier.name}</strong>  ${'{'}selectedTier.price{'}'}
            </p>
            <div className={styles.modalActions}>
              <button className={styles.primaryCta} onClick={() => setModalOpen(false)}>Proceed</button>
              <button className={styles.btnSecondary} onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}