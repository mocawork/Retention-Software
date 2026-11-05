import { BrandRedirect } from "./brand-redirect";

/** "/" sends people to their last brand, or to "Create brand" if they have none. */
export default function RootPage() {
  return <BrandRedirect />;
}
