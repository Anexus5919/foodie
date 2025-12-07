import type { Metadata } from "next";
import { Open_Sans } from "next/font/google"; 
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { BottomNav } from "../components/layout/bottom-nav";
import { AiChatbot } from "../components/chatbot/ai-chatbot"; // <--- Import here

const fontSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Foodie - Delivery App",
  description: "Fastest food delivery in town",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.className} min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <AiChatbot /> {/* <--- Add component here */}
          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}