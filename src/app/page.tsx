import { redirect } from 'next/navigation';

// Entry point: send people into the app. The dashboard's guard redirects to
// /login if there is no session.
export default function Home() {
  redirect('/dashboard');
}
