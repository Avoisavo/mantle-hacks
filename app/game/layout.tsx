import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./game.css";

const lexend = Lexend({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Sovereign Vault - RWA Equity Game",
    description: "RWA Equity Game",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={lexend.className}>{children}</div>
    );
}
