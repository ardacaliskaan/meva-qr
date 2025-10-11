'use client'
import { useState, useRef } from 'react'
import { Download, Printer, Eye } from 'lucide-react'
import QRCode from 'qrcode'

export default function AdminQRPage() {
  const [tableNumbers, setTableNumbers] = useState('')
  const [qrCodes, setQrCodes] = useState([])
  const [baseUrl, setBaseUrl] = useState('')
  const canvasRefs = useRef({})

  useState(() => {
    // Client-side'da window objesine erişim
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const generateQRCodes = async () => {
    const tables = tableNumbers.split(',').map(num => num.trim()).filter(num => num)
    const codes = []

    for (const tableNum of tables) {
      if (tableNum && !isNaN(tableNum)) {
        const url = `${baseUrl}/menu/${tableNum}`
        
        try {
          const qrDataUrl = await QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          
          codes.push({
            tableNumber: tableNum,
            url: url,
            qrCode: qrDataUrl
          })
        } catch (error) {
          console.error('QR kod oluşturma hatası:', error)
        }
      }
    }

    setQrCodes(codes)
  }

  const downloadQR = (tableNumber, dataUrl) => {
    const link = document.createElement('a')
    link.download = `masa-${tableNumber}-qr.png`
    link.href = dataUrl
    link.click()
  }

  const downloadAllQRs = () => {
    qrCodes.forEach(qr => {
      setTimeout(() => {
        downloadQR(qr.tableNumber, qr.qrCode)
      }, 100 * qrCodes.indexOf(qr))
    })
  }

  const printQR = (tableNumber) => {
    const qr = qrCodes.find(q => q.tableNumber === tableNumber)
    if (!qr) return

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Masa ${tableNumber} QR Kod</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px solid #000;
              border-radius: 10px;
              background: white;
            }
            h1 {
              margin: 0 0 20px 0;
              font-size: 24px;
            }
            p {
              margin: 20px 0 0 0;
              font-size: 14px;
              color: #666;
            }
            img {
              max-width: 250px;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>MASA ${tableNumber}</h1>
            <img src="${qr.qrCode}" alt="QR Kod" />
            <p>Menüyü görmek için QR kodu okutun</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const previewQR = (tableNumber) => {
    const url = `${baseUrl}/menu/${tableNumber}`
    window.open(url, '_blank')
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Kod Üretici</h1>
        <p className="text-gray-600">Masalar için QR kodlar oluşturun ve yazdırın</p>
      </div>

      {/* QR Code Generator Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masa Numaraları
            </label>
            <input
              type="text"
              placeholder="1, 2, 3, 4, 5... (virgülle ayırın)"
              value={tableNumbers}
              onChange={(e) => setTableNumbers(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Örnek: 1,2,3,4,5 veya 1-10 arası tüm masalar için: 1,2,3,4,5,6,7,8,9,10
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Menü URL&apos;i
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://yourrestaurant.com"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={generateQRCodes}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
            >
              QR Kodları Oluştur
            </button>
            
            {qrCodes.length > 0 && (
              <button
                onClick={downloadAllQRs}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Hepsini İndir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Generated QR Codes */}
      {qrCodes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Oluşturulan QR Kodlar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map(qr => (
              <div key={qr.tableNumber} className="border rounded-lg p-4 text-center">
                <h3 className="text-lg font-semibold mb-3">Masa {qr.tableNumber}</h3>
                
                <div className="mb-4">
                  <img 
                    src={qr.qrCode} 
                    alt={`Masa ${qr.tableNumber} QR Kod`}
                    className="mx-auto w-48 h-48 border"
                  />
                </div>
                
                <div className="text-xs text-gray-500 mb-4 break-all">
                  {qr.url}
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => downloadQR(qr.tableNumber, qr.qrCode)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    İndir
                  </button>
                  
                  <button
                    onClick={() => printQR(qr.tableNumber)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Yazdır
                  </button>
                  
                  <button
                    onClick={() => previewQR(qr.tableNumber)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Önizle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}