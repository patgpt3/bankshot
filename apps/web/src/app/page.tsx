"use client";
import styles from "./page.module.css";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";

export default function Page() {
  const { ready, authenticated, login, logout } = usePrivy();

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
        <div className={styles.productCtas}>
          <button className={styles.primaryCta} disabled>
            Buy Access Pass
          </button>
        </div>
      </section>
    </main>
  );
}