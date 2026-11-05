import type { Metadata } from "next";

import { NewBrandView } from "./new-brand-view";

export const metadata: Metadata = { title: "Create your brand" };

export default function NewBrandPage() {
  return <NewBrandView />;
}
