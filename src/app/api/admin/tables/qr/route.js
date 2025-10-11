import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

// POST - QR kod oluştur
export async function POST(request) {
  try {
    const { tableNumber, menuUrl } = await request.json()

    if (!tableNumber || !menuUrl) {
      return NextResponse.json({ 
        error: 'Masa numarası ve menü URL\'i gerekli' 
      }, { status: 400 })
    }

    const qrCodeOptions = {
      width: 400,
      height: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92
    }

    const qrCodeDataURL = await QRCode.toDataURL(menuUrl, qrCodeOptions)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      menuUrl,
      tableNumber,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('QR Code generation error:', error)
    return NextResponse.json({ 
      error: 'QR kod oluşturulurken hata oluştu'
    }, { status: 500 })
  }
}

// GET - Toplu QR kod oluşturma
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tablesParam = searchParams.get('tables')
    const baseUrl = searchParams.get('baseUrl') || 'http://192.168.1.100:3000'

    if (!tablesParam) {
      return NextResponse.json({ 
        error: 'tables parametresi gerekli (örn: ?tables=1,2,3)' 
      }, { status: 400 })
    }

    const tableNumbers = tablesParam
      .split(',')
      .map(num => num.trim())
      .filter(num => num && !isNaN(num))

    if (tableNumbers.length === 0) {
      return NextResponse.json({ 
        error: 'Geçerli masa numarası bulunamadı' 
      }, { status: 400 })
    }

    const qrCodes = []
    const errors = []

    for (const tableNum of tableNumbers) {
      try {
        const menuUrl = `${baseUrl}/menu/${tableNum}`
        
        const qrCodeDataURL = await QRCode.toDataURL(menuUrl, {
          width: 400,
          height: 400,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M'
        })

        qrCodes.push({
          tableNumber: tableNum,
          menuUrl,
          qrCode: qrCodeDataURL,
          success: true
        })

      } catch (error) {
        errors.push({
          tableNumber: tableNum,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      qrCodes,
      errors,
      summary: {
        total: tableNumbers.length,
        successful: qrCodes.length,
        failed: errors.length
      },
      generatedAt: new Date().toISOString(),
      baseUrl
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Toplu QR kod oluşturulurken hata oluştu'
    }, { status: 500 })
  }
}

// DELETE - QR kod sil
export async function DELETE(request) {
  try {
    const { tableNumber } = await request.json()

    if (!tableNumber) {
      return NextResponse.json({ 
        error: 'Masa numarası gerekli' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Masa ${tableNumber} QR kod silme işlemi tamamlandı`,
      tableNumber,
      deletedAt: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'QR kod silinirken hata oluştu'
    }, { status: 500 })
  }
}