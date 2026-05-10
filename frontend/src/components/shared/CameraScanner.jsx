import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';

/**
 * CameraScanner
 * Props:
 *   onScan(code: string) — called when barcode/QR detected
 *   onClose()            — called when user closes scanner
 *   title                — optional heading text
 */
export default function CameraScanner({ onScan, onClose, title = 'Scan Barcode / IMEI' }) {
  const videoRef    = useRef(null);
  const readerRef   = useRef(null);
  const controlsRef = useRef(null);

  const [cameras,    setCameras]   = useState([]);
  const [selectedCam,setSelected]  = useState('');
  const [status,     setStatus]    = useState('starting'); // starting | scanning | error
  const [errorMsg,   setErrorMsg]  = useState('');
  const [lastCode,   setLastCode]  = useState('');
  const [torch,      setTorch]     = useState(false);
  const [stream,     setStream]    = useState(null);

  // ── List available cameras ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Ask permission first
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(s);
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams    = devices.filter(d => d.kind === 'videoinput');
        setCameras(cams);
        // Prefer back camera
        const back = cams.find(c =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment')
        );
        setSelected(back?.deviceId || cams[0]?.deviceId || '');
        // Stop permission stream — real stream started below
        s.getTracks().forEach(t => t.stop());
      } catch (err) {
        setStatus('error');
        setErrorMsg('Camera permission denied. Please allow camera access and retry.');
      }
    })();
  }, []);

  // ── Start decoding when camera selected ────────────────────────────────────
  useEffect(() => {
    if (!selectedCam || !videoRef.current) return;

    let cancelled = false;

    const startScan = async () => {
      try {
        // Stop previous controls
        if (controlsRef.current) {
          try { controlsRef.current.stop(); } catch (_) {}
        }

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        setStatus('scanning');

        const hints = new Map();
        // Support all common formats including EAN-13 (used on phone boxes)
        hints.set(2 /* DecodeHintType.POSSIBLE_FORMATS */, [
          1,  // AZTEC
          2,  // CODABAR
          3,  // CODE_39
          4,  // CODE_93
          5,  // CODE_128
          6,  // DATA_MATRIX
          8,  // EAN_8
          13, // EAN_13
          11, // ITF
          12, // MAXICODE
          14, // PDF_417
          15, // QR_CODE
          16, // RSS_14
          17, // RSS_EXPANDED
          18, // UPC_A
          19, // UPC_E
          20, // UPC_EAN_EXTENSION
        ]);

        const controls = await reader.decodeFromVideoDevice(
          selectedCam,
          videoRef.current,
          (result, err, ctrl) => {
            if (cancelled) return;
            if (result) {
              const code = result.getText();
              setLastCode(code);
              // Vibrate on success
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              onScan(code);
            }
          }
        );

        controlsRef.current = controls;
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg('Could not start camera: ' + err.message);
        }
      }
    };

    startScan();

    return () => {
      cancelled = true;
      if (controlsRef.current) {
        try { controlsRef.current.stop(); } catch (_) {}
      }
    };
  }, [selectedCam, onScan]);

  // ── Torch toggle ────────────────────────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    try {
      const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
      if (!track) return;
      const newVal = !torch;
      await track.applyConstraints({ advanced: [{ torch: newVal }] });
      setTorch(newVal);
    } catch {
      // torch not supported — silently fail
    }
  }, [torch]);

  const handleClose = () => {
    if (controlsRef.current) try { controlsRef.current.stop(); } catch (_) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black bg-opacity-80 shrink-0">
        <button onClick={handleClose}
          className="text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
          ✕
        </button>
        <p className="text-white font-semibold text-sm text-center flex-1 px-2">{title}</p>
        {/* Torch button */}
        <button onClick={toggleTorch}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors text-xl
                      ${torch ? 'bg-yellow-400 text-black' : 'text-white hover:bg-white hover:bg-opacity-20'}`}>
          🔦
        </button>
      </div>

      {/* ── Camera feed ── */}
      <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Scanning overlay */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Dark corners */}
            <div className="absolute inset-0 bg-black bg-opacity-40" style={{
              WebkitMaskImage: 'radial-gradient(ellipse 60% 35% at 50% 50%, transparent 100%, black 100%)',
              maskImage: 'radial-gradient(ellipse 60% 35% at 50% 50%, transparent 100%, black 100%)',
            }} />

            {/* Scan frame */}
            <div className="relative w-72 h-44 sm:w-80 sm:h-52">
              {/* Corner brackets */}
              {[
                'top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl',
                'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
                'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl',
                'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-green-400 ${cls}`} />
              ))}

              {/* Scanning laser line */}
              <div className="absolute left-2 right-2 h-0.5 bg-green-400 shadow-lg shadow-green-400 animate-scan-line" />
            </div>

            <p className="text-white text-xs mt-6 bg-black bg-opacity-50 px-3 py-1.5 rounded-full">
              Point camera at barcode or IMEI
            </p>
          </div>
        )}

        {/* Starting spinner */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white text-sm">Starting camera...</p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black px-8 text-center">
            <span className="text-5xl mb-4">📷</span>
            <p className="text-red-400 font-semibold mb-2">Camera Error</p>
            <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
            <button onClick={handleClose}
              className="px-5 py-2.5 bg-white text-black font-semibold rounded-xl text-sm">
              Close
            </button>
          </div>
        )}

        {/* Last scanned flash */}
        {lastCode && (
          <div className="absolute bottom-20 left-4 right-4">
            <div className="bg-green-500 text-white rounded-2xl px-4 py-3 shadow-xl animate-fade-in">
              <p className="text-xs font-bold opacity-80 mb-0.5">✅ Scanned!</p>
              <p className="font-mono font-bold text-base break-all">{lastCode}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Camera selector ── */}
      {cameras.length > 1 && (
        <div className="bg-black bg-opacity-90 px-4 py-3 shrink-0">
          <p className="text-gray-400 text-xs mb-1.5">Select Camera</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {cameras.map((cam, i) => (
              <button
                key={cam.deviceId}
                onClick={() => setSelected(cam.deviceId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0
                            ${selectedCam === cam.deviceId
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {cam.label || `Camera ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Laser animation CSS */}
      <style>{`
        @keyframes scan-line {
          0%   { top: 8px;   opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 1; }
          100% { top: 8px;   opacity: 1; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
          position: absolute;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
