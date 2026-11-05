/**
 * Form rules that mirror the backend (technical.md §2.3: "validation mirrors backend rules").
 * Uses Zod's "mini" API: the same library, tree-shakable, so pages stay inside the
 * 200 KB JS budget (design.md §3.5 rule 26).
 */
import * as z from "zod/mini";

/** backend/config/settings/base.py: MinimumLengthValidator(min_length=10). */
export const PASSWORD_MIN_LENGTH = 10;

export const emailSchema = z.pipe(
  z.string().check(z.trim(), z.minLength(1, { error: "Enter an email address." })),
  z.email({ error: "Enter a valid email address, like name@yourbrand.com." }),
);

export const newPasswordSchema = z
  .string()
  .check(
    z.minLength(PASSWORD_MIN_LENGTH, { error: `Use at least ${PASSWORD_MIN_LENGTH} characters.` }),
  );

export const requiredPasswordSchema = z
  .string()
  .check(z.minLength(1, { error: "Enter your password." }));

/** backend Brand.name: max 120 characters, not blank. */
export const brandNameSchema = z
  .string()
  .check(
    z.trim(),
    z.minLength(1, { error: "Enter your brand's name." }),
    z.maxLength(120, { error: "Keep the name under 120 characters." }),
  );

export const roleSchema = z.enum(["owner", "admin", "marketer", "viewer"]);
