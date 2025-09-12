import "./globals.css";
import { IBM_Plex_Mono, Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-plex-mono",
});
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk && process.env.NODE_ENV !== "production") {
    console.warn("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }
  return (
    <ClerkProvider
      publishableKey={pk}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/login"}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/signup"}
      afterSignInUrl={
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard"
      }
      afterSignUpUrl={
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/dashboard"
      }
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${plexMono.variable} font-mono antialiased min-h-dvh flex flex-col`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
