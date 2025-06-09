import { useState, useRef, useEffect } from 'react';
import { verificarRosto } from '@/lib/apiBiometria';
import { useSearchParams } from 'next/navigation';

export default function RegistrarPresenca() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [base64Foto, setBase64Foto] = useState('');
  const searchParams = useSearchParams();
  const processo = searchParams.get('processo');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, []);

  const capturar = async () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setBase64Foto(dataUrl);

    const res = await verificarRosto(processo!, dataUrl);
    if (res.success) alert('✅ Presença confirmada!');
    else alert('❌ Rosto não reconhecido!');
  };

  return (
    <div className="text-center p-6">
      <video ref={videoRef} autoPlay className="rounded border w-full max-w-sm mx-auto" />
      <button onClick={capturar} className="mt-4 bg-primary text-white px-6 py-2 rounded">
        Verificar Presença
      </button>
      {base64Foto && <img src={base64Foto} alt="Foto capturada" className="mt-4 mx-auto rounded" />}
    </div>
  );
}
