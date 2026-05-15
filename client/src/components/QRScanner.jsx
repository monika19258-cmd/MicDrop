import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api/axios'

export default function QRScanner({ onSuccess }) {
  const scannerRef = useRef(null)
  const containerRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const startScanner = async () => {
    if (scannerRef.current || isScanning) return

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        handleScan,
        (errorMessage) => {
          // Ignore scan errors (called frequently when no QR in frame)
        }
      )
      setIsScanning(true)
    } catch (err) {
      toast.error('Could not access camera. Please allow camera permissions.')
      console.error('QR scanner error:', err)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (e) {
        // ignore stop errors
      }
      scannerRef.current = null
      setIsScanning(false)
    }
  }

  const handleScan = async (decodedText) => {
    if (isProcessing || decodedText === lastScanned) return
    setIsProcessing(true)
    setLastScanned(decodedText)

    try {
      const { data } = await api.post('/admin/checkin', { qrToken: decodedText })
      toast.success(`Checked in: ${data.attendeeName || 'Guest'}`)
      if (onSuccess) onSuccess(data)
    } catch (err) {
      const message = err.response?.data?.message || 'Check-in failed'
      toast.error(message)
    } finally {
      // Allow re-scanning after 3 seconds
      setTimeout(() => {
        setIsProcessing(false)
        setLastScanned(null)
      }, 3000)
    }
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="text-center mb-6">
        <h3 className="text-white font-semibold text-lg mb-1">QR Check-In Scanner</h3>
        <p className="text-gray-400 text-sm">Scan attendee QR codes to check them in</p>
      </div>

      {/* Scanner area */}
      <div className="relative mx-auto mb-6" style={{ maxWidth: 320 }}>
        <div
          id="qr-reader"
          ref={containerRef}
          className="w-full rounded-xl overflow-hidden bg-gray-800"
          style={{ minHeight: 240 }}
        />
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-xl">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9V6a2 2 0 012-2h2M3 15v3a2 2 0 002 2h2m10-18h2a2 2 0 012 2v3m0 10v3a2 2 0 01-2 2h-2M9 9h1.5a1 1 0 011 1v1.5M9 15h1.5a1 1 0 001-1v-1.5M14.5 9H16a1 1 0 011 1v1.5M14.5 15H16a1 1 0 001-1v-1.5" />
              </svg>
              <p className="text-gray-500 text-sm">Camera inactive</p>
            </div>
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-gray-950/70 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-700 border-t-violet-500 rounded-full animate-spin" />
              <span className="text-white text-sm">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-6 py-2.5 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-2.5 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop Scanner
          </button>
        )}
      </div>

      {/* Status indicator */}
      {isScanning && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Scanner active — point at a QR code
        </div>
      )}
    </div>
  )
}
