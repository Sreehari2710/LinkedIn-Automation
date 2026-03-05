"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <Link href="/">
                        LinkedIn<span>Automation</span>
                    </Link>
                </div>
                <ul className={styles.navLinks}>
                    <li>
                        <Link href="/" className={pathname === '/' ? styles.active : ''}>
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link href="/results" className={pathname === '/results' ? styles.active : ''}>
                            Results
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
