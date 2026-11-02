import { signOut } from "@/app/actions/auth";

export default function Suspended() {
  return (
    <main className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="page-title">Account suspended</h1>
      <p className="mt-3 text-muted">Your account has been suspended. Please contact support if you think this is a mistake.</p>
      <form action={signOut} className="mt-6">
        <button className="btn-secondary">Sign out</button>
      </form>
    </main>
  );
}
