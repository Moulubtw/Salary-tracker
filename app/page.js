import LandingPage from "@/components/LandingPage";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  return <LandingPage signedIn={Boolean(user)} />;
}
