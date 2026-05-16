"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { loginAction, registerAction } from "@/lib/actions/auth";

type Props = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: Props) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState(action, null);
  const [role, setRole] = useState<"CUSTOMER" | "CLEANER">("CUSTOMER");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  return (
    <form action={formAction} className="panel grid gap-4 p-6">
      {mode === "register" ? (
        <>
          <input type="hidden" name="role" value={role} />
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-gray-50 p-1">
            <button
              type="button"
              className={role === "CUSTOMER" ? "button-primary" : "button-secondary"}
              onClick={() => setRole("CUSTOMER")}
            >
              Korisnik
            </button>
            <button
              type="button"
              className={role === "CLEANER" ? "button-primary" : "button-secondary"}
              onClick={() => setRole("CLEANER")}
            >
              Pružalac usluge
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="label">Ime</span>
              <input className="field" name="firstName" autoComplete="given-name" required />
            </label>
            <label className="grid gap-1">
              <span className="label">Prezime</span>
              <input className="field" name="lastName" autoComplete="family-name" required />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="label">Telefon</span>
            <input className="field" name="phone" type="tel" autoComplete="tel" placeholder="+381 64 123 4567" required />
          </label>
          <label className="grid gap-1">
            <span className="label">Email {role === "CLEANER" ? "(opciono)" : ""}</span>
            <input className="field" name="email" type="email" autoComplete="email" required={role === "CUSTOMER"} />
          </label>
          {role === "CLEANER" ? (
            <p className="rounded-md bg-leaf px-3 py-2 text-sm text-brand">
              Za pružaoce usluge telefon + lozinka su dovoljni za registraciju. Admin proverava profil pre aktivacije.
            </p>
          ) : null}
        </>
      ) : (
        <>
          <input type="hidden" name="loginMethod" value={loginMethod} />
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-gray-50 p-1">
            <button
              type="button"
              className={loginMethod === "email" ? "button-primary" : "button-secondary"}
              onClick={() => setLoginMethod("email")}
            >
              Email
            </button>
            <button
              type="button"
              className={loginMethod === "phone" ? "button-primary" : "button-secondary"}
              onClick={() => setLoginMethod("phone")}
            >
              Telefon
            </button>
          </div>
          {loginMethod === "email" ? (
            <label className="grid gap-1">
              <span className="label">Email</span>
              <input className="field" name="email" type="email" autoComplete="email" required />
            </label>
          ) : (
            <label className="grid gap-1">
              <span className="label">Telefon</span>
              <input className="field" name="phone" type="tel" autoComplete="tel" placeholder="+381 64 123 4567" required />
            </label>
          )}
        </>
      )}

      <label className="grid gap-1">
        <span className="label">Lozinka</span>
        <input
          className="field"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>
      {state?.error ? <p className="rounded-md bg-coral/10 px-3 py-2 text-sm font-medium text-coral">{state.error}</p> : null}
      <SubmitButton>{mode === "login" ? "Prijavi se" : "Napravi nalog"}</SubmitButton>
    </form>
  );
}
