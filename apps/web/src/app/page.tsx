"use client";
import styles from "./page.module.css";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";

type Tier = { name: string; price: number; perks: string[] };

export default function Page() {
  const { ready, authenticated, login, logout } = usePrivy();

  // Countdown to first demo (placeholder target)
  const target = useMemo(() => new Date(Date.now() + 4*24*60*60*1000 + 15*60*60*1000), []);
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(diff / (24*60*60*1000));
  const h = Math.floor((diff % (24*60*60*1000)) / (60*60*1000));
  const m = Math.floor((diff % (60*60*1000)) / (60*1000));
  const s = Math.floor((diff % (60*1000)) / 1000);

  // Funding/progress (placeholder)
  const totalSupply = 1000;
  const minted = 256;
  const fundedPct = Math.round((minted / totalSupply) * 100);

  const tiers: Tier[] = [
    { name: "Access Pass", price: 25, perks: ["Mint with Privy", "Unlock demo access", "Collectible & tradable"] },
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const onMint = () => { if (!authenticated) { login(); return; } setModalOpen(true); };

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.bigTitle}>
            Own the Future<br/>of AI Film Creation
          </h1>
          <p className={styles.subtitle}>
            Mint your exclusive MovieCook Access Pass on Bankshot and witness the first-ever live AI-generated feature film.
          </p>
          <div className={styles.ctaRow}>
            <button className={styles.primaryCta} disabled={!ready} onClick={onMint}>Mint Access Pass</button>
            <a className={styles.secondaryCta} href="#" aria-label="Watch demo">Watch Demo</a>
          </div>
          <p className={styles.note}>Only 1,000 passes available</p>
        </div>
        <div className={styles.heroMedia}>
          <Image src="/moviecook.jpg" alt="MovieCook device" width={960} height={540} className={styles.heroImage} />
        </div>
      </section>

      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <span className={styles.icon}></span>
            <h3>Mint with Privy</h3>
            <p>Secure your pass on-chain with Privy.</p>
          </div>
          <div className={styles.step}>
            <span className={styles.icon}></span>
            <h3>Unlock Demo Access</h3>
            <p>Join the live premieres event of MovieCook.</p>
          </div>
          <div className={styles.step}>
            <span className={styles.icon}></span>
            <h3>Own a Piece of the Future</h3>
            <p>Collectible and tradable access pass.</p>
          </div>
        </div>
      </section>

      <section className={styles.countdownSection}>
        <div className={styles.countdown}>{String(d).padStart(2,'0')}d:{String(h).padStart(2,'0')}h:{String(m).padStart(2,'0')}m {String(s).padStart(2,'0')}s</div>
        <div className={styles.countdownSub}>Until the First Demo</div>
        <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${fundedPct}%` }}/></div>
        <div className={styles.progressMeta}>{minted} of {totalSupply} passes minted  {fundedPct}% funded</div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Explore the Device</h2>
        <ul className={styles.bullets}>
          <li>Stacked AI hardware</li>
          <li>Real-time rendering</li>
          <li>Modular GPU upgrades</li>
        </ul>
        <div className={styles.brands}>
          <div className={styles.brand}>Powered by <strong>Privy</strong></div>
          <div className={styles.brand}><strong>Bankshot</strong> Launchpad</div>
        </div>
      </section>

      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Mint Access Pass (placeholder)</h3>
            <p>On-chain mint will be enabled after mainnet program deployment.</p>
            <div className={styles.modalActions}>
              <button className={styles.primaryCta} onClick={() => setModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}