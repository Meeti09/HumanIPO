import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { PrototypeBanner } from '@/components/PrototypeBanner'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HumanYield — fund a person’s future',
  description:
    'Income Share Agreements as a consumer product. Fund someone’s course, certification or creative project and receive a programmatic share of their reported income, settled on Monad Testnet.',
  openGraph: {
    title: 'HumanYield',
    description:
      'Fund a person’s future. Repayment moves with their income, settled on Monad.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>
          <PrototypeBanner />
          <SiteHeader />
          <main id="main" className="min-h-[70vh]">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  )
}
