import { redirect } from 'next/navigation';

export default function Home() {
  // Canvas画面にリダイレクト
  redirect('/canvas');
}
