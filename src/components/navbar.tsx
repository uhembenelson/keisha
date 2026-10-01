import { NavbarClient } from "@/components/navbar-client";
import { getCmsContent } from "@/lib/cms";

export async function Navbar() {
  const { settings } = await getCmsContent();
  return <NavbarClient socialLinks={settings.socialLinks} />;
}
