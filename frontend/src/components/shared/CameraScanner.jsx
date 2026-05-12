import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * CameraScanner — Zero dependency!
 * Uses browser's built-in BarcodeDetector API (Chrome/Android supported)
 * Falls back to manual input if not supported
 *
 * Props:
 *   onScan(code)  — called when barcode detected
 *   onClose()     — called when user closes
 *   title         — heading text
 */
export default function CameraScanner({ onScan, onClose, title = 'Scan Barcode / IMEI' }) {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const streamRef     = useRef(null);
  const animFrameRef  = useRef(null);
  const detectorRef   = useRef(null);
  const scannedRef    = useRef(false); // prevent double-fire

  const [status,     setStatus]    = useState('starting');
  const [errorMsg,   setErrorMsg]  = useState('');
  const [lastCode,   setLastCode]  = useState('');
  const [cameras,    setCameras]   = useState([]);
  const [selectedCam,setSelectedCam] = useState('');
  const [torch,      setTorch]     = useState(false);
  const [supported,  setSupported] = useState(true);
  const [manualImei, setManualImei]= useState('');

  // ── Stop everything ────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  // ── Start camera + scanning loop ───────────────────────────────────────────
  const startCamera = useCallback(async (deviceId) => {
    stopAll();
    scannedRef.current = false;
    setStatus('starting');
    setLastCode('');

    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // List cameras after permission granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams    = devices.filter(d => d.kind === 'videoinput');
      setCameras(cams);

      // Check BarcodeDetector support
      if (!('BarcodeDetector' in window)) {
        setSupported(false);
        setStatus('unsupported');
        return;
      }

      // Create detector
      detectorRef.current = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'code_93',
                  'qr_code', 'upc_a', 'upc_e', 'itf', 'pdf417',
                  'data_matrix', 'aztec', 'codabar']
      });

      setStatus('scanning');

      // Scan loop
      const scan = async () => {
        if (scannedRef.current) return;
        if (!videoRef.current || videoRef.current.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0 && !scannedRef.current) {
            const code = barcodes[0].rawValue;
            scannedRef.current = true;
            setLastCode(code);
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            // Small delay so user sees the green flash
            setTimeout(() => {
              onScan(code);
            }, 600);
            return; // stop scanning
          }
        } catch (_) {}
        animFrameRef.current = requestAnimationFrame(scan);
      };

      animFrameRef.current = requestAnimationFrame(scan);

    } catch (err) {
      setStatus('error');
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied.\nPlease allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device.');
      } else {
        setErrorMsg('Could not start camera: ' + err.message);
      }
    }
  }, [stopAll, onScan]);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    startCamera('');
    return stopAll;
  }, []);

  // ── Switch camera ──────────────────────────────────────────────────────────
  const switchCamera = (deviceId) => {
    setSelectedCam(deviceId);
    startCamera(deviceId);
  };

  // ── Torch ──────────────────────────────────────────────────────────────────
  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks?.()?.[0];
      if (!track) return;
      const next = !torch;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorch(next);
    } catch (_) {} // silently fail if not supported
  };

  // ── Close ──────────────────────────────────────────────────────────────────
  const handleClose = () => { stopAll(); onClose(); };

  // ── Manual IMEI submit ─────────────────────────────────────────────────────
  const handleManual = (e) => {
    e.preventDefault();
    if (manualImei.trim().length >= 8) {
      stopAll();
      onScan(manualImei.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col" style={{ touchAction: 'none' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black bg-opacity-80 shrink-0 safe-area-top">
        <button onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white text-xl
                     hover:bg-white hover:bg-opacity-20 active:scale-95 transition-all">
          ✕
        </button>
        <p className="text-white font-semibold text-sm text-center flex-1 px-2 truncate">{title}</p>
        <button onClick={toggleTorch}
          className={`w-10 h-10 flex items-center justify-center rounded-full text-xl transition-all
                      ${torch ? 'bg-yellow-400 text-black' : 'text-white hover:bg-white hover:bg-opacity-20'}`}>
          🔦
        </button>
      </div>

      {/* ── Video feed ── */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline muted autoPlay
        />
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* ── Scanning overlay ── */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Dark vignette */}
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(ellipse 65% 40% at 50% 50%, transparent 60%, rgba(0,0,0,0.7) 100%)'
            }} />

            {/* Scan frame */}
            <div className="relative w-72 h-44 sm:w-80 sm:h-52">
              {/* Corners */}
              {[
                'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl',
                'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl',
                'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl',
                'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-7 h-7 border-green-400 ${cls}`} />
              ))}

              {/* Laser line */}
              <div className="absolute left-3 right-3 h-[2px] bg-green-400 rounded-full"
                style={{
                  boxShadow: '0 0 8px 2px rgba(74,222,128,0.8)',
                  animation: 'laserScan 2s ease-in-out infinite',
                  top: '8px'
                }}
              />
            </div>

            <p className="relative text-white text-xs mt-5 bg-black bg-opacity-60 px-4 py-1.5 rounded-full">
              📷 Point at barcode or IMEI label
            </p>
          </div>
        )}

        {/* ── Success flash ── */}
        {lastCode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-green-500 opacity-20 animate-pulse" />
            <div className="bg-green-500 text-white rounded-2xl px-5 py-4 shadow-2xl mx-4 text-center"
              style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <p className="text-2xl mb-1">✅</p>
              <p className="text-xs font-bold opacity-90 mb-1">Scanned Successfully!</p>
              <p className="font-mono font-bold text-sm break-all">{lastCode}</p>
            </div>
          </div>
        )}

        {/* ── Starting spinner ── */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90">
            <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-white text-sm">Starting camera...</p>
          </div>
        )}

        {/* ── Error state ── */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-95 px-8 text-center">
            <span className="text-6xl mb-4">📵</span>
            <p className="text-red-400 font-bold text-base mb-2">Camera Error</p>
            <p className="text-gray-400 text-sm mb-6 whitespace-pre-line">{errorMsg}</p>
            <button onClick={() => startCamera('')}
              className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm mb-3 active:scale-95">
              🔄 Try Again
            </button>
            <button onClick={handleClose}
              className="px-5 py-2.5 bg-gray-700 text-white font-semibold rounded-xl text-sm active:scale-95">
              Close
            </button>
          </div>
        )}

        {/* ── Unsupported browser ── */}
        {status === 'unsupported' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-95 px-6 text-center">
            <span className="text-5xl mb-3">⚠️</span>
            <p className="text-yellow-400 font-bold mb-2">Browser Not Supported</p>
            <p className="text-gray-400 text-xs mb-1">Use Chrome on Android for best results.</p>
            <p className="text-gray-500 text-xs mb-5">Or enter IMEI manually below:</p>
            <form onSubmit={handleManual} className="w-full max-w-xs">
              <input
                type="text" inputMode="numeric" value={manualImei}
                onChange={e => setManualImei(e.target.value)}
                placeholder="Type IMEI here..."
                className="w-full px-4 py-3 rounded-xl text-black font-mono text-sm mb-3 text-center"
              />
              <button type="submit"
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl active:scale-95">
                Confirm IMEI
              </button>
            </form>
            <button onClick={handleClose} className="mt-3 text-gray-500 text-sm">Cancel</button>
          </div>
        )}
      </div>

      {/* ── Camera switcher ── */}
      {cameras.length > 1 && status === 'scanning' && (
        <div className="bg-black bg-opacity-90 px-4 py-2.5 shrink-0">
          <div className="flex gap-2 overflow-x-auto">
            {cameras.map((cam, i) => (
              <button key={cam.deviceId} onClick={() => switchCamera(cam.deviceId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors
                            ${selectedCam === cam.deviceId || (!selectedCam && i === 0)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                {cam.label?.replace(/\(.*\)/, '').trim() || `Camera ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Manual entry fallback (always visible at bottom) ── */}
      {(status === 'scanning' || status === 'starting') && (
        <div className="bg-gray-900 px-4 py-3 shrink-0 border-t border-gray-700">
          <form onSubmit={handleManual} className="flex gap-2 items-center">
            <input
              type="text" inputMode="numeric" value={manualImei}
              onChange={e => setManualImei(e.target.value)}
              placeholder="Or type IMEI manually..."
              className="flex-1 px-3 py-2 rounded-xl bg-gray-800 text-white placeholder-gray-500
                         text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700"
            />
            <button type="submit" disabled={manualImei.length < 8}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl
                         disabled:opacity-40 active:scale-95 transition-all shrink-0">
              OK
            </button>
          </form>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes laserScan {
          0%   { top: 8px; }
          50%  { top: calc(100% - 8px); }
          100% { top: 8px; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
