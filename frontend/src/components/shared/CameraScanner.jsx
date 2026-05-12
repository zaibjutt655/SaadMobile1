import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * CameraScanner — Scans ONLY inside the green box
 * Uses canvas crop to restrict detection to scan region
 */
export default function CameraScanner({ onScan, onClose, title = 'Scan Barcode / IMEI' }) {
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const animFrameRef = useRef(null);
  const detectorRef  = useRef(null);
  const scannedRef   = useRef(false);

  const [status,      setStatus]     = useState('starting');
  const [errorMsg,    setErrorMsg]   = useState('');
  const [lastCode,    setLastCode]   = useState('');
  const [cameras,     setCameras]    = useState([]);
  const [selectedCam, setSelectedCam]= useState('');
  const [torch,       setTorch]      = useState(false);
  const [manualImei,  setManualImei] = useState('');
  const [supported,   setSupported]  = useState(true);

  const stopAll = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  const startCamera = useCallback(async (deviceId) => {
    stopAll();
    scannedRef.current = false;
    setStatus('starting');
    setLastCode('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter(d => d.kind === 'videoinput'));

      if (!('BarcodeDetector' in window)) {
        setSupported(false);
        setStatus('unsupported');
        return;
      }

      detectorRef.current = new window.BarcodeDetector({
        formats: ['ean_13','ean_8','code_128','code_39','code_93',
                  'qr_code','upc_a','upc_e','itf','pdf417','data_matrix','aztec','codabar']
      });

      setStatus('scanning');

      // ── Scan loop — crops to ROI box before detecting ──────────────────────
      const scan = async () => {
        if (scannedRef.current) return;

        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(scan);
          return;
        }

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) { animFrameRef.current = requestAnimationFrame(scan); return; }

        // ── Calculate ROI: center box, 75% wide, 35% tall ─────────────────
        // Matches the green scan box shown on screen
        const roiW = Math.floor(vw * 0.75);
        const roiH = Math.floor(vh * 0.35);
        const roiX = Math.floor((vw - roiW) / 2);
        const roiY = Math.floor((vh - roiH) / 2);

        // Draw only the ROI onto canvas
        canvas.width  = roiW;
        canvas.height = roiH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, roiX, roiY, roiW, roiH, 0, 0, roiW, roiH);

        try {
          const barcodes = await detectorRef.current.detect(canvas);
          if (barcodes.length > 0 && !scannedRef.current) {
            const code = barcodes[0].rawValue;
            scannedRef.current = true;
            setLastCode(code);
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            setTimeout(() => { onScan(code); }, 700);
            return;
          }
        } catch (_) {}

        animFrameRef.current = requestAnimationFrame(scan);
      };

      animFrameRef.current = requestAnimationFrame(scan);

    } catch (err) {
      setStatus('error');
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied.\nAllow camera access in browser settings.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device.');
      } else {
        setErrorMsg('Could not start camera:\n' + err.message);
      }
    }
  }, [stopAll, onScan]);

  useEffect(() => { startCamera(''); return stopAll; }, []);

  const switchCamera = (id) => { setSelectedCam(id); startCamera(id); };

  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks?.()?.[0];
      if (!track) return;
      const next = !torch;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorch(next);
    } catch (_) {}
  };

  const handleClose  = () => { stopAll(); onClose(); };

  const handleManual = (e) => {
    e.preventDefault();
    if (manualImei.trim().length >= 8) { stopAll(); onScan(manualImei.trim()); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col" style={{ touchAction: 'none' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black bg-opacity-90 shrink-0">
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

      {/* Camera view */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover"
          playsInline muted autoPlay />

        {/* Hidden canvas — ROI crop happens here */}
        <canvas ref={canvasRef} className="hidden" />

        {/* ── Scan overlay ── */}
        {status === 'scanning' && !lastCode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">

            {/* Dark mask — 4 sides around the scan box */}
            {/* Top */}
            <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-65"
              style={{ bottom: '57.5%' }} />
            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-65"
              style={{ top: '57.5%' }} />
            {/* Left */}
            <div className="absolute left-0 bg-black bg-opacity-65"
              style={{ top: '42.5%', bottom: '42.5%', right: '87.5%' }} />
            {/* Right */}
            <div className="absolute right-0 bg-black bg-opacity-65"
              style={{ top: '42.5%', bottom: '42.5%', left: '87.5%' }} />

            {/* Scan box — 75% wide, 35% tall, centered */}
            <div className="absolute"
              style={{ left: '12.5%', right: '12.5%', top: '32.5%', bottom: '32.5%' }}>

              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-green-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-green-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-green-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-green-400 rounded-br-lg" />

              {/* Laser scan line */}
              <div className="absolute left-2 right-2 h-[2px] rounded-full bg-green-400"
                style={{
                  boxShadow: '0 0 10px 3px rgba(74,222,128,0.9)',
                  animation: 'laserScan 2s ease-in-out infinite',
                  top: '6px'
                }}
              />

              {/* Center crosshair dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                              w-1.5 h-1.5 bg-green-400 rounded-full opacity-70" />
            </div>

            {/* Labels */}
            <div className="absolute text-center" style={{ top: '25%' }}>
              <p className="text-white text-xs font-semibold bg-black bg-opacity-50 px-3 py-1 rounded-full">
                Place barcode inside the box
              </p>
            </div>
            <div className="absolute text-center" style={{ bottom: '27%' }}>
              <p className="text-green-400 text-xs animate-pulse">
                🔍 Scanning...
              </p>
            </div>
          </div>
        )}

        {/* Success flash */}
        {lastCode && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-green-500 text-white rounded-2xl px-6 py-5 shadow-2xl mx-6 text-center"
              style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <p className="text-3xl mb-2">✅</p>
              <p className="text-xs font-bold opacity-90 mb-2 uppercase tracking-wide">Scanned!</p>
              <p className="font-mono font-bold text-lg break-all">{lastCode}</p>
            </div>
          </div>
        )}

        {/* Starting */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90">
            <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-white text-sm">Starting camera...</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black px-8 text-center">
            <span className="text-6xl mb-4">📵</span>
            <p className="text-red-400 font-bold mb-2">Camera Error</p>
            <p className="text-gray-400 text-sm mb-6 whitespace-pre-line">{errorMsg}</p>
            <button onClick={() => startCamera('')}
              className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm mb-3 active:scale-95">
              🔄 Try Again
            </button>
            <button onClick={handleClose}
              className="px-5 py-2.5 bg-gray-700 text-white font-semibold rounded-xl text-sm">
              Close
            </button>
          </div>
        )}

        {/* Unsupported */}
        {status === 'unsupported' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black px-6 text-center">
            <span className="text-5xl mb-3">⚠️</span>
            <p className="text-yellow-400 font-bold mb-1">Scanner Not Supported</p>
            <p className="text-gray-400 text-xs mb-2">Use Chrome on Android for camera scanning.</p>
            <p className="text-gray-500 text-xs mb-5">Enter IMEI manually:</p>
            <form onSubmit={handleManual} className="w-full max-w-xs">
              <input type="text" inputMode="numeric" value={manualImei}
                onChange={e => setManualImei(e.target.value)}
                placeholder="Type IMEI here..."
                className="w-full px-4 py-3 rounded-xl text-black font-mono text-sm mb-3 text-center" />
              <button type="submit"
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl active:scale-95">
                Confirm
              </button>
            </form>
            <button onClick={handleClose} className="mt-3 text-gray-500 text-sm">Cancel</button>
          </div>
        )}
      </div>

      {/* Camera switcher */}
      {cameras.length > 1 && status === 'scanning' && (
        <div className="bg-black bg-opacity-90 px-4 py-2 shrink-0 border-t border-gray-800">
          <div className="flex gap-2 overflow-x-auto">
            {cameras.map((cam, i) => (
              <button key={cam.deviceId} onClick={() => switchCamera(cam.deviceId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors
                            ${selectedCam === cam.deviceId || (!selectedCam && i === 0)
                              ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                {cam.label?.replace(/\(.*?\)/g, '').trim() || `Camera ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual input — always at bottom */}
      {(status === 'scanning' || status === 'starting') && (
        <div className="bg-gray-900 px-4 py-3 shrink-0 border-t border-gray-800">
          <form onSubmit={handleManual} className="flex gap-2 items-center">
            <input type="text" inputMode="numeric" value={manualImei}
              onChange={e => setManualImei(e.target.value)}
              placeholder="Or type IMEI manually..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-gray-800 text-white placeholder-gray-500
                         text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700" />
            <button type="submit" disabled={manualImei.length < 8}
              className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl
                         disabled:opacity-40 active:scale-95 transition-all shrink-0">
              OK
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes laserScan {
          0%   { top: 6px; }
          50%  { top: calc(100% - 6px); }
          100% { top: 6px; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
