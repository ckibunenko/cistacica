import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function LoginPage({
  searchParams
}: {
  searchParams: { registered?: string };
}) {
  await redirectIfAuthenticated();

  return (
    <main className="container-page grid min-h-[calc(100vh-64px)] place-items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-black text-ink">Prijava</h1>
        <p className="mt-2 text-muted">
          {searchParams.registered === "cleaner"
            ? "Prijava pružaoca usluge je primljena. Admin mora aktivirati nalog pre prijave."
            : "Uđite preko emaila ili telefona, u zavisnosti od toga kako je nalog napravljen."}
        </p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-4 text-sm text-muted">
          Nemaš nalog?{" "}
          <Link href="/register" className="font-semibold text-brand">
            Registruj se
          </Link>
        </p>
      </div>
    </main>
  );
}
