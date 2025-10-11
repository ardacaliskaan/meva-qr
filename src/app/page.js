'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MevaIndexRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/meva/menu/demo')
  }, [router])

  return null
}
