import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <main className="container-page grid min-h-[calc(100vh-64px)] place-items-center py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-black text-ink">Registracija</h1>
        <p className="mt-2 text-muted">Korisnici mogu odmah zakazivati. Pružaoci usluge čekaju admin proveru.</p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
        <p className="mt-4 text-sm text-muted">
          Imaš nalog?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Prijavi se
          </Link>
        </p>
      </div>
    </main>
  );
}
