// app/(public)/signup/actions.ts
"use server";

export type RegisterResult = { ok: true } | { ok: false; error: string };

function passwordMeetsPolicy(pw: string) {
  const lengthOK = pw.length >= 10;
  const upperOK = /[A-Z]/.test(pw);
  const numberOK = /\d/.test(pw);
  const specialOK = /[^A-Za-z0-9]/.test(pw);
  return {
    lengthOK,
    upperOK,
    numberOK,
    specialOK,
    all: lengthOK && upperOK && numberOK && specialOK,
  };
}

export async function register(formData: FormData): Promise<RegisterResult> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  const accepted = String(formData.get("accept") || "") === "on"; // <-- from hidden input

  if (!accepted)
    return { ok: false, error: "Please accept the Terms and Privacy Policy." };
  if (!name) return { ok: false, error: "Name is required." };
  if (!email) return { ok: false, error: "Email is required." };
  if (password !== confirm)
    return { ok: false, error: "Passwords do not match." };

  const policy = passwordMeetsPolicy(password);
  if (!policy.all)
    return { ok: false, error: "Password does not meet the required policy." };

  // TODO: create user, set secure cookie, redirect("/app")
  return { ok: true };
}
