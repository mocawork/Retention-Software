/** Form rules that mirror the backend (technical.md §2.3: "validation mirrors backend rules"). */
import { z } from "zod";

/** backend/config/settings/base.py: MinimumLengthValidator(min_length=10). */
export const PASSWORD_MIN_LENGTH = 10;

export const emailSchema = z
  .string()
  .trim()
  .min(1, { error: "Enter an email address." })
  .pipe(z.email({ error: "Enter a valid email address, like name@yourbrand.com." }));

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: `Use at least ${PASSWORD_MIN_LENGTH} characters.` });

/** backend Brand.name: max 120 characters, not blank. */
export const brandNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Enter your brand's name." })
  .max(120, { error: "Keep the name under 120 characters." });
