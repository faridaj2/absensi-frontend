import { useRef, useState, useEffect } from 'react';
import Button from '../ui/Button';

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  async function startCamera() {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Akses kamera tidak didukung di browser ini.');
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      // Stream dipasang melalui useEffect agar videoRef ter-mount lebih dulu
    } catch (err) {
      console.error('Kamera error:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan di browser.');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], `absen-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(blob);
      setPreview(imageUrl);
      onCapture?.(file);
      stopCamera();
    }, 'image/jpeg');
  }

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.error('Play error:', err));
    }
  }, [isCameraActive, stream]);

  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      onCapture?.(file);
      stopCamera();
    }
  }

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        accept="image/*"
        capture="user"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {!isCameraActive && !preview && (
        isMobile ? (
          <Button onClick={() => fileInputRef.current?.click()}>
            Buka Kamera HP
          </Button>
        ) : (
          <Button onClick={startCamera}>
            Buka Kamera Web
          </Button>
        )
      )}

      {error && (
        <div className="rounded-xl bg-status-danger-bg px-3 py-2 text-sm text-status-danger-text">
          <p>{error}</p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" size="sm" onClick={startCamera}>
              Coba Buka Kamera Lagi
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Pilih/Ambil Foto File
            </Button>
          </div>
        </div>
      )}

      {isCameraActive && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => videoRef.current?.play()}
            className="w-full max-w-sm rounded-xl border border-border-subtle bg-black"
          />
          <div className="flex gap-2">
            <Button onClick={capturePhoto}>Jepret Foto</Button>
            <Button variant="secondary" onClick={stopCamera}>Batal</Button>
          </div>
        </div>
      )}

      {preview && !isCameraActive && (
        <div className="space-y-2">
          <img
            src={preview}
            alt="Pratinjau foto"
            className="w-48 rounded-xl border border-border-subtle object-cover"
          />
          <Button variant="secondary" size="sm" onClick={isMobile ? () => fileInputRef.current?.click() : startCamera}>
            Ambil Ulang
          </Button>
        </div>
      )}
    </div>
  );
}
