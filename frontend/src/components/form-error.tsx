import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

/** A form-level error, announced to screen readers. Renders nothing without a message. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="danger" role="alert">
      <AlertCircle aria-hidden="true" />
      <AlertDescription className="text-text">{message}</AlertDescription>
    </Alert>
  );
}
