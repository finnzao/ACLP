'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function MarcarPresencaPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [imageData, setImageData] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const processo = searchParams.get('processo');
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        // Ativa a câmera
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        });

        // Função para parar a câmera
        const stopCamera = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };

        // Detecta mudança de visibilidade da aba
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopCamera();
            }
        };

        // Detecta mudança de rota
        const handleBeforeUnload = () => {
            stopCamera();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup geral
        return () => {
            stopCamera();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const capturarFoto = () => {
        const canvas = document.createElement('canvas');
        const video = videoRef.current!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageData(dataUrl);

        fetch('/api/verify-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ processo, image: dataUrl }),
        }).then(res => res.json()).then(data => {
            if (data.success) alert('✅ Presença confirmada!');
            else alert('❌ Rosto não reconhecido');
        });
    };

    return (
        <div className="p-6 max-w-md mx-auto text-center">
            <h1 className="text-2xl font-semibold mb-4">Reconhecimento Facial</h1>
            <video ref={videoRef} autoPlay width="320" height="240" className="mx-auto rounded border" />
            <button
                onClick={capturarFoto}
                className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
            >
                Capturar e Marcar Presença
            </button>
            {imageData && <img src={imageData} alt="Captura" className="mt-4 rounded" />}
        </div>
    );
}
