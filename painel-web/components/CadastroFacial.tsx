// painel-web/components/CadastroFacial.tsx
'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { salvarRostoReferencia, validarFrame } from '@/lib/api/facialRecognition';
import { Camera, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface CadastroFacialProps {
  processo: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type StatusValidacao = 'neutro' | 'valido' | 'invalido';

export default function CadastroFacial({ processo, onSuccess, onError }: CadastroFacialProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [estado, setEstado] = useState<'inicial' | 'capturando' | 'preview' | 'salvando' | 'sucesso' | 'erro'>('inicial');
  const [imagemCapturada, setImagemCapturada] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [statusValidacao, setStatusValidacao] = useState<StatusValidacao>('neutro');
  const [mensagemValidacao, setMensagemValidacao] = useState('');
  const [podeCapturar, setPodeCapturar] = useState(false);

  // Cores do círculo de validação
  const corCirculo = {
    neutro: 'stroke-gray-300',
    valido: 'stroke-green-500',
    invalido: 'stroke-red-500'
  };

  // Validar frame em tempo real
  const validarFrameTempoReal = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || estado !== 'capturando') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Capturar frame atual
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const resultado = await validarFrame(imageData);
      
      if (resultado.valid) {
        setStatusValidacao('valido');
        setMensagemValidacao(resultado.message);
        setPodeCapturar(true);
      } else {
        setStatusValidacao('invalido');
        setMensagemValidacao(resultado.message);
        setPodeCapturar(false);
      }
    } catch (error) {
      console.error('Erro na validação:', error);
      setStatusValidacao('neutro');
      setMensagemValidacao('Posicione seu rosto no centro');
    }
  }, [estado]);

  // Iniciar câmera
  const iniciarCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraAtiva(true);
        setEstado('capturando');
        
        // Iniciar validação em tempo real
        intervalRef.current = setInterval(validarFrameTempoReal, 500);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setEstado('erro');
      setMensagem('Não foi possível acessar a câmera.');
      onError?.('Erro ao acessar câmera');
    }
  }, [onError, validarFrameTempoReal]);

  // Parar câmera
  const pararCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraAtiva(false);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Capturar foto
  const capturarFoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !podeCapturar) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setImagemCapturada(imageData);
    setEstado('preview');
    pararCamera();
  }, [pararCamera, podeCapturar]);

  // Salvar foto
  const salvarFoto = useCallback(async () => {
    if (!imagemCapturada) return;

    setEstado('salvando');

    try {
      const resultado = await salvarRostoReferencia(processo, imagemCapturada);

      if (resultado.success) {
        setEstado('sucesso');
        setMensagem('Foto cadastrada com sucesso!');
        onSuccess?.();
      } else {
        setEstado('erro');
        setMensagem(resultado.message || 'Erro ao salvar foto');
        onError?.(resultado.message || 'Erro ao salvar');
      }
    } catch (error: any) {
      setEstado('erro');
      setMensagem(error.message || 'Erro ao salvar foto');
      onError?.(error.message);
    }
  }, [imagemCapturada, processo, onSuccess, onError]);

  // Tentar novamente
  const tentarNovamente = useCallback(() => {
    setImagemCapturada(null);
    setMensagem('');
    setStatusValidacao('neutro');
    setMensagemValidacao('');
    setPodeCapturar(false);
    setEstado('inicial');
    iniciarCamera();
  }, [iniciarCamera]);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      pararCamera();
    };
  }, [pararCamera]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4 text-primary-dark">
        Cadastro de Foto para Reconhecimento Facial
      </h3>

      {/* Estados da interface */}
      {estado === 'inicial' && (
        <div className="text-center">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Clique no botão abaixo para tirar uma foto
          </p>
          <button
            onClick={iniciarCamera}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-all"
          >
            Abrir Câmera
          </button>
        </div>
      )}

      {/* Captura de vídeo */}
      {(estado === 'capturando' || estado === 'preview') && (
        <div className="space-y-4">
          {estado === 'capturando' && (
            <div className="relative rounded-lg overflow-hidden bg-black" style={{ maxHeight: '400px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* Guia de posicionamento com cor dinâmica */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 640 480">
                  <ellipse
                    cx="320"
                    cy="240"
                    rx="120"
                    ry="160"
                    fill="none"
                    className={`${corCirculo[statusValidacao]} transition-colors duration-300`}
                    strokeWidth="3"
                    strokeDasharray={statusValidacao === 'valido' ? '0' : '5 5'}
                    opacity="0.8"
                  />
                  
                  {/* Indicadores de status */}
                  {statusValidacao === 'valido' && (
                    <g>
                      <circle cx="320" cy="80" r="15" fill="#10b981" opacity="0.8" />
                      <path d="M312 80 L316 84 L328 72" stroke="white" strokeWidth="2" fill="none" />
                    </g>
                  )}
                  
                  {statusValidacao === 'invalido' && (
                    <g>
                      <circle cx="320" cy="80" r="15" fill="#ef4444" opacity="0.8" />
                      <g stroke="white" strokeWidth="2">
                        <line x1="312" y1="72" x2="328" y2="88" />
                        <line x1="328" y1="72" x2="312" y2="88" />
                      </g>
                    </g>
                  )}
                </svg>
              </div>
            </div>
          )}

          {/* Preview da imagem capturada */}
          {estado === 'preview' && imagemCapturada && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={imagemCapturada}
                alt="Foto capturada"
                className="w-full h-auto"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
          )}

          {/* Canvas oculto */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Indicador de status em tempo real */}
          {estado === 'capturando' && (
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm ${
                statusValidacao === 'valido' ? 'bg-green-100 text-green-800' : 
                statusValidacao === 'invalido' ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  statusValidacao === 'valido' ? 'bg-green-500' : 
                  statusValidacao === 'invalido' ? 'bg-red-500' : 
                  'bg-gray-400'
                } animate-pulse`} />
                {mensagemValidacao}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-center gap-4">
            {estado === 'capturando' && (
              <button
                onClick={capturarFoto}
                className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
                  podeCapturar 
                    ? 'bg-primary text-white hover:bg-primary-dark' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!podeCapturar}
              >
                <Camera className="w-5 h-5" />
                Capturar Foto
              </button>
            )}

            {estado === 'preview' && (
              <>
                <button
                  onClick={tentarNovamente}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Tirar Outra
                </button>
                <button
                  onClick={salvarFoto}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Usar Esta Foto
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Estado salvando */}
      {estado === 'salvando' && (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Salvando foto...</p>
        </div>
      )}

      {/* Estado sucesso */}
      {estado === 'sucesso' && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-green-600 font-semibold text-lg">{mensagem}</p>
        </div>
      )}

      {/* Estado erro */}
      {estado === 'erro' && (
        <div className="text-center py-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-4">{mensagem}</p>
          <button
            onClick={tentarNovamente}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Dicas */}
      {(estado === 'capturando' || estado === 'preview') && (
        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">Dicas importantes:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-start">
              <span className={`mr-1 ${statusValidacao === 'valido' ? 'text-green-600' : ''}`}>•</span>
              <span>Posicione o rosto dentro do círculo</span>
            </li>
            <li className="flex items-start">
              <span className="mr-1">•</span>
              <span>Mantenha boa iluminação</span>
            </li>
            <li className="flex items-start">
              <span className="mr-1">•</span>
              <span>Evite usar óculos escuros</span>
            </li>
            <li className="flex items-start">
              <span className="mr-1">•</span>
              <span>Olhe diretamente para a câmera</span>
            </li>
          </ul>
          <div className="mt-2 text-xs text-blue-700">
            {statusValidacao === 'valido' && '✅ Posicionamento correto!'}
            {statusValidacao === 'invalido' && '⚠️ Ajuste seu posicionamento'}
          </div>
        </div>
      )}
    </div>
  );
}