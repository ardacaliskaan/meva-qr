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
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              borderRadius: '12px',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f3f4f6',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f3f4f6',
              },
            },
          }}
        />
      </body>
    </html>
  )
}