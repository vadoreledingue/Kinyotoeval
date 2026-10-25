import "./globals.css";

export const metadata = {
  title: "Carnet d'auto-évaluation",
  description: "Auto-évaluation individuelle du groupe Kinyobi",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#262319"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
