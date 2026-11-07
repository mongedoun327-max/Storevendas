import React from "react";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="bg-[#0b0b0b] text-white">
        {children}
        {/* Configuração do Toaster com posição no canto superior direito */}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            duration: 4000,
            style: {
              background: "transparent",
              border: "none",
              boxShadow: "none",
              padding: 0,
            },
          }}
        />
      </body>
    </html>
  );
}
