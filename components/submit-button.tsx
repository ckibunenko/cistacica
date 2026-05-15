"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  variant = "primary"
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const className =
    variant === "danger" ? "button-danger" : variant === "secondary" ? "button-secondary" : "button-primary";

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Sačuvavam..." : children}
    </button>
  );
}
