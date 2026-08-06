import type { Metadata } from "next";
import "@/index.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Bộ Sưu Tập",
  description: "S3 Explorer - Trình duyệt và quản lý file trên Amazon S3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
