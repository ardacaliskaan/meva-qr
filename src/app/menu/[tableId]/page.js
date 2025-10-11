'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MevaLoadingScreen from '@/components/MevaLoadingScreen'

export default function MenuTablePage({ params }) {
  const [showLoading, setShowLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Params'ı unwrap et
    const unwrapParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
    }
    unwrapParams()
  }, [params])

  const handleLoadingComplete = () => {
    setShowLoading(false)
    // Ana menü kategoriler sayfasına yönlendir
    router.push(`/menu/${tableId}/categories`)
  }

  if (showLoading && tableId) {
    return (
      <MevaLoadingScreen 
        onComplete={handleLoadingComplete}
        tableNumber={tableId}
      />
    )
  }

  // Loading tamamlandığında kategoriler sayfasına yönlendiriliyor
  // Bu return hiç görünmeyecek ama fallback olarak bırakıyoruz
  return null
}