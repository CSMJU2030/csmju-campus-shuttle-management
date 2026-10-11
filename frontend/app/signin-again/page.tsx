import { sameSitePath } from "@/lib/sign-in";
import { ReSignIn } from "@/csmju";

export const dynamic = "force-dynamic";

/**
 * Where a form action or loop guard goes when the backend answers 401.
 * Asks the user before re-initiating SSO to prevent loops or unsaved form loss.
 */
export default async function SignInAgainPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return <ReSignIn next={sameSitePath(next)} ask />;
}
