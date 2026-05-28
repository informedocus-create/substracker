import './globals.css';
import { SubsProvider } from '@/lib/context';
import Providers from "@/components/Providers";

export const metadata = {
  title: 'SubTracker — Track Every Subscription. Stop Wasting Money.',
  description: 'SubTracker automatically finds your subscriptions from Gmail and tracks every renewal. Built for India — UPI, ₹, and all Indian apps supported.',
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
