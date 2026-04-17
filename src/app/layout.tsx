import type { Metadata } from 'next';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/toast/Toast';

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "any" }],
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-outfit dark:bg-gray-900" suppressHydrationWarning>
        <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <SidebarProvider>{children}</SidebarProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
