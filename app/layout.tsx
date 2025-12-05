import type { Metadata } from "next"; // Import Metadata type
import { AuthProvider } from "@/app/app/context/AuthContext";
import "./globals.css";

// 1. Define Metadata for SEO and PWA support
export const metadata: Metadata = {
  title: "WhisperNote",
  description: "Your voice-controlled reminder assistant.",
  manifest: "/manifest.json", // Link to the manifest we created
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WhisperNote",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Viewport setting for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" /> 
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}