import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { BRAND_NAME } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { dashboardPathForRole } from "@/lib/services/access-control";

export const metadata: Metadata = {
  title: "CistoDom MVP",
  description: "Managed marketplace za provereno čišćenje doma u Beogradu."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="sr-Latn">
      <body>
        <header className="border-b border-line bg-white/90 backdrop-blur">
          <div className="container-page flex min-h-16 items-center justify-between gap-4 py-3">
            <Link href="/" className="text-xl font-black tracking-normal text-ink">
              {BRAND_NAME}
            </Link>
            <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
              <Link href="/book" className="button-primary">
                Zakaži čišćenje
              </Link>
              {user ? (
                <>
                  <Link href={dashboardPathForRole(user.role)} className="button-secondary">
                    Moj panel
                  </Link>
                  <form action={logoutAction}>
                    <button className="button-secondary" type="submit">
                      Odjava
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="button-secondary">
                    Prijava
                  </Link>
                  <Link href="/register" className="button-secondary">
                    Registracija
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
