import { redirect } from 'next/navigation';

/** Root → always redirect to the dashboard (or login if unauthenticated). */
export default function Root() {
  redirect('/dashboard');
}
