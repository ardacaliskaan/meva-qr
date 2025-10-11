import { Inter } from 'next/font/google'
import './globals.css'
import AuthGuard from '@/components/AuthGuard'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Meva Kitap Cafe QR Menu',
  description: 'Professional QR menu system for restaurants',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthGuard>
          {children}
        </AuthGuard>

      </body>
    </html>
  )
}