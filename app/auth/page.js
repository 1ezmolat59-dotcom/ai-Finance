// Server component — forces dynamic rendering so auth client is never prerendered
export const dynamic = "force-dynamic";

import AuthForm from "./AuthForm";

export default function AuthPage() {
  return <AuthForm />;
}
