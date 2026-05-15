"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { loginAction, registerAction } from "@/lib/actions/auth";

type Props = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: Props) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="panel grid gap-4 p-6">
      {mode === "register" ? (
        <>
          <label className="grid gap-1">
            <span className="label">Ime i prezime</span>
            <input className="field" name="name" autoComplete="name" required />
          </label>
          <label className="grid gap-1">
            <span className="label">Telefon</span>
            <input className="field" name="phone" autoComplete="tel" />
          </label>
          <label className="grid gap-1">
            <span className="label">Tip naloga</span>
            <select className="field" name="role" defaultValue="CUSTOMER">
              <option value="CUSTOMER">Korisnik</option>
              <option value="CLEANER">Pružalac usluge</option>
            </select>
          </label>
        </>
      ) : null}
      <label className="grid gap-1">
        <span className="label">Email</span>
        <input className="field" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="grid gap-1">
        <span className="label">Lozinka</span>
        <input className="field" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
      </label>
      {state?.error ? <p className="rounded-md bg-coral/10 px-3 py-2 text-sm font-medium text-coral">{state.error}</p> : null}
      <SubmitButton>{mode === "login" ? "Prijavi se" : "Napravi nalog"}</SubmitButton>
    </form>
  );
}
