import './globals.css';
import { SubsProvider } from '@/lib/context';
import Providers from "@/components/Providers";

export const metadata = {
  title: 'SubTrack — Subscription Manager',
  description: 'Track all your subscriptions, free trials, and spending in one place.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SubsProvider>
            {children}
          </SubsProvider>
        </Providers>
      </body>
    </html>
  );
}
