import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--background-primary, #000)' }}>
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}
