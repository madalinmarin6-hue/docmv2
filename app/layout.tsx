import "./globals.css"
import { Poppins } from "next/font/google"
import SessionProvider from "../components/SessionProvider"
import StructuredData from "../components/StructuredData"
import { AppProvider } from "../components/AppContext"
import CookieBanner from "../components/CookieBanner"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300","400","500","600","700"]
})

export const metadata = {
  title: "DocM — Online Document Editor & Converter",
  description: "Edit, convert and manage PDF, Word, Excel, PowerPoint and 10+ formats online. No installation needed.",
  keywords: ["pdf editor", "document converter", "word to pdf", "excel editor", "online office", "file converter", "pdf creator"],
  authors: [{ name: "DocM" }],
  openGraph: {
    title: "DocM — Online Document Editor & Converter",
    description: "Edit, convert and manage PDF, Word, Excel, PowerPoint and 10+ formats online. No installation needed.",
    type: "website",
    siteName: "DocM",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocM — Online Document Editor & Converter",
    description: "Edit, convert and manage PDF, Word, Excel, PowerPoint and 10+ formats online.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (

<html lang="en">

<head>
<StructuredData />
</head>

<body
className={`${poppins.className} min-h-screen`}
>

<SessionProvider>
<AppProvider>
{children}
<CookieBanner />
</AppProvider>
</SessionProvider>

</body>

</html>

)

}