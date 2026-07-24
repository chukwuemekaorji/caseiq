import type { Metadata } from "next";
import type { ReactNode } from "react";
import IdentityProvider from "@/components/IdentityProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaseIQ",
  description: "Medical timeline & case review",
  icons: { icon: "/icon.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <IdentityProvider>{children}</IdentityProvider>
      </body>
    </html>
  );
}
