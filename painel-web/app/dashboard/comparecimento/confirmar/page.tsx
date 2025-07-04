// painel-web/app/dashboard/comparecimento/confirmar/page.tsx
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verificarRosto, confirmarComparecimento, validarFrame, salvarRostoReferencia } from '@/lib/api/facialRecognition';
import { Camera, CheckCircle, XCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import ModalCadastroReferencia from '@/components/ModalCadastroReferencia';
import { ErrorCodes, getErrorMessage, isCustomError } from '@/lib/utils/errorHandler';

type EstadoVerificacao = 'inicial' | 'capturando' | 'verificando' | 'sucesso' | 'erro';
type StatusValidacao = 'neutro' | 'valido' | 'invalido';

interface MensagemEstado {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  cor: string;
}

export default function ConfirmarPresencaPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [estado, setEstado] = useState<EstadoVerificacao>('inicial');
  const [mensagem, setMensagem] = useState('');
  const [confianca, setConfianca] = useState<number | null>(null);
  const [comparecimentoId, setComparecimentoId] = useState<string | null>(null);
  const [contadorCaptura, setContadorCaptura] = useState<number | null>(null);
  const [statusValidacao, setStatusValidacao] = useState<StatusValidacao>('neutro');
  const [mensagemValidacao, setMensagemValidacao] = useState('');
  const [podeCapturar, setPodeCapturar] = useState(false);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [imagemCapturada, setImagemCapturada] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const processo = searchParams.get('processo');

  // Mensagens por estado
  const mensagensEstado: Record<EstadoVerificacao, MensagemEstado> = {
    inicial: {
      titulo: 'Preparando câmera...',
      descricao: 'Aguarde enquanto ativamos a câmera',
      icone: <Camera className="w-16 h-16" />,
      cor: 'text-blue-500'
    },
    capturando: {
      titulo: 'Posicione seu rosto',
      descricao: mensagemValidacao || 'Mantenha o rosto centralizado e bem iluminado',
      icone: <Camera className="w-16 h-16 animate-pulse" />,
      cor: 'text-blue-500'
    },
    verificando: {
      titulo: 'Verificando identidade...',
      descricao: 'Por favor, aguarde',
      icone: <Loader2 className="w-16 h-16 animate-spin" />,
      cor: 'text-yellow-500'
    },
    sucesso: {
      titulo: '✅ Presença confirmada!',
      descricao: mensagem,
      icone: <CheckCircle className="w-16 h-16" />,
      cor: 'text-green-500'
    },
    erro: {
      titulo: '❌ Verificação falhou',
      descricao: mensagem,
      icone: <XCircle className="w-16 h-16" />,
      cor: 'text-red-500'
    }
  };

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
      setMensagemValidacao('');
    }
  }, [estado]);

  // Parar câmera
  const pararCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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
        setEstado('capturando');
        
        // Iniciar validação em tempo real
        intervalRef.current = setInterval(validarFrameTempoReal, 500); // Validar 2x por segundo
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setEstado('erro');
      setMensagem('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  }, [validarFrameTempoReal]);

  // Capturar foto
  const capturarFoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !processo || !podeCapturar) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Parar validação em tempo real
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Configurar canvas com as dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para base64
    const imageData = canvas.toDataURL('image/jpeg', 0.95);

    setEstado('verificando');

    try {
      const resultado = await verificarRosto(processo, imageData);

      if (resultado.verified) {
        setEstado('sucesso');
        setConfianca(resultado.confidence || null);
        setComparecimentoId(resultado.comparecimento_id || null);
        setMensagem(`Identidade confirmada com ${resultado.confidence}% de confiança!`);
        
        // Parar câmera após sucesso
        pararCamera();
        
        // Confirmar comparecimento automaticamente após 2 segundos
        if (resultado.comparecimento_id) {
          setTimeout(async () => {
            await confirmarComparecimento(resultado.comparecimento_id!);
            setTimeout(() => router.push('/dashboard/geral'), 2000);
          }, 2000);
        }
      } else {
        setEstado('erro');
        setMensagem(resultado.message || 'Rosto não reconhecido. Tente novamente.');
        
        // Voltar para captura após 3 segundos
        setTimeout(() => {
          setEstado('capturando');
          // Reiniciar validação em tempo real
          intervalRef.current = setInterval(validarFrameTempoReal, 500);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erro na captura:', error);
      
      // Verificar o tipo de erro usando o sistema de erros
      if (isCustomError(error) && error.code === ErrorCodes.NO_REFERENCE_PHOTO) {
        // Não há foto cadastrada - abrir modal para oferecer cadastro
        setImagemCapturada(imageData);
        setModalCadastroAberto(true);
        
        // Parar câmera enquanto o modal está aberto
        pararCamera();
      } else {
        // Outros tipos de erro
        setEstado('erro');
        setMensagem(getErrorMessage(error));
        
        // Determinar tempo de retry baseado no tipo de erro
        const retryDelay = error.code === ErrorCodes.NETWORK_ERROR ? 5000 : 3000;
        
        // Voltar para captura após delay
        setTimeout(() => {
          setEstado('capturando');
          // Reiniciar validação em tempo real
          intervalRef.current = setInterval(validarFrameTempoReal, 500);
        }, retryDelay);
      }
    }
  }, [processo, podeCapturar, pararCamera, router, validarFrameTempoReal]);

  // Salvar como referência
  const salvarComoReferencia = useCallback(async () => {
    if (!imagemCapturada || !processo) return;

    setEstado('verificando');
    setMensagem('Salvando foto como referência...');

    try {
      const resultado = await salvarRostoReferencia(processo, imagemCapturada);

      if (resultado.success) {
        setEstado('sucesso');
        setMensagem('Foto salva como referência! Seu comparecimento foi registrado.');
        
        // Parar câmera
        pararCamera();
        
        // Redirecionar após 3 segundos
        setTimeout(() => router.push('/dashboard/geral'), 3000);
      } else {
        setEstado('erro');
        setMensagem(resultado.message || 'Erro ao salvar foto como referência');
        setModalCadastroAberto(false);
      }
    } catch (error: any) {
      setEstado('erro');
      setMensagem(error.message || 'Erro ao salvar foto');
      setModalCadastroAberto(false);
    }
  }, [imagemCapturada, processo, pararCamera, router]);

  // Captura automática com contagem regressiva
  const iniciarCapturaAutomatica = useCallback(() => {
    if (!podeCapturar) return;
    
    let contador = 3;
    setContadorCaptura(contador);

    const interval = setInterval(() => {
      contador--;
      setContadorCaptura(contador);

      if (contador === 0) {
        clearInterval(interval);
        setContadorCaptura(null);
        capturarFoto();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [capturarFoto, podeCapturar]);

  // Efeitos
  useEffect(() => {
    iniciarCamera();

    return () => {
      pararCamera();
    };
  }, [iniciarCamera, pararCamera]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pararCamera();
      } else if (estado === 'capturando') {
        iniciarCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [estado, iniciarCamera, pararCamera]);

  if (!processo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl">Processo não informado</p>
        </div>
      </div>
    );
  }

  const estadoAtual = mensagensEstado[estado];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">
            Reconhecimento Facial
          </h1>
          <p className="text-lg text-gray-600">
            Processo: <span className="font-mono font-bold">{processo}</span>
          </p>
        </div>

        {/* Área principal */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Status */}
          <div className="text-center mb-6">
            <div className={`${estadoAtual.cor} mb-4 flex justify-center`}>
              {estadoAtual.icone}
            </div>
            <h2 className="text-2xl font-semibold mb-2">{estadoAtual.titulo}</h2>
            <p className={`text-gray-600 ${statusValidacao === 'invalido' ? 'text-red-600 font-semibold' : ''} ${statusValidacao === 'valido' ? 'text-green-600 font-semibold' : ''}`}>
              {estadoAtual.descricao}
            </p>
            
            {confianca !== null && (
              <div className="mt-4 inline-block bg-green-100 px-4 py-2 rounded-full">
                <span className="text-green-800 font-semibold">
                  Confiança: {confianca}%
                </span>
              </div>
            )}
          </div>

          {/* Área do vídeo */}
          <div className="relative rounded-xl overflow-hidden bg-black mx-auto" 
               style={{ maxWidth: '640px', maxHeight: '480px' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Overlay com guias */}
            {estado === 'capturando' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Moldura facial com cor dinâmica */}
                <svg className="w-full h-full" viewBox="0 0 640 480">
                  <ellipse
                    cx="320"
                    cy="240"
                    rx="150"
                    ry="200"
                    fill="none"
                    className={`${corCirculo[statusValidacao]} transition-colors duration-300`}
                    strokeWidth="4"
                    strokeDasharray={statusValidacao === 'valido' ? '0' : '10 5'}
                    opacity="0.8"
                  />
                  
                  {/* Indicadores de status */}
                  {statusValidacao === 'valido' && (
                    <g>
                      <circle cx="320" cy="100" r="20" fill="#10b981" opacity="0.8" />
                      <path d="M310 100 L315 105 L330 90" stroke="white" strokeWidth="3" fill="none" />
                    </g>
                  )}
                  
                  {statusValidacao === 'invalido' && (
                    <g>
                      <circle cx="320" cy="100" r="20" fill="#ef4444" opacity="0.8" />
                      <g stroke="white" strokeWidth="3">
                        <line x1="310" y1="90" x2="330" y2="110" />
                        <line x1="330" y1="90" x2="310" y2="110" />
                      </g>
                    </g>
                  )}
                </svg>

                {/* Contador */}
                {contadorCaptura !== null && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-8xl font-bold animate-ping">
                      {contadorCaptura}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Canvas oculto para captura */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Indicador de status em tempo real */}
          {estado === 'capturando' && (
            <div className="mt-4 text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full ${
                statusValidacao === 'valido' ? 'bg-green-100 text-green-800' : 
                statusValidacao === 'invalido' ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  statusValidacao === 'valido' ? 'bg-green-500' : 
                  statusValidacao === 'invalido' ? 'bg-red-500' : 
                  'bg-gray-400'
                } animate-pulse`} />
                {mensagemValidacao || 'Aguardando posicionamento...'}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="mt-8 flex justify-center gap-4">
            {estado === 'capturando' && (
              <>
                <button
                  onClick={iniciarCapturaAutomatica}
                  className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all transform shadow-lg ${
                    podeCapturar 
                      ? 'bg-primary text-white hover:bg-primary-dark hover:scale-105' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={contadorCaptura !== null || !podeCapturar}
                >
                  {contadorCaptura !== null ? 'Capturando...' : 'Tirar Foto'}
                </button>
                
                <button
                  onClick={() => router.back()}
                  className="bg-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
              </>
            )}

            {estado === 'erro' && (
              <button
                onClick={() => {
                  setEstado('capturando');
                  // Reiniciar validação em tempo real
                  intervalRef.current = setInterval(validarFrameTempoReal, 500);
                }}
                className="bg-yellow-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-yellow-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Tentar Novamente
              </button>
            )}

            {estado === 'sucesso' && (
              <button
                onClick={() => router.push('/dashboard/geral')}
                className="bg-green-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>

        {/* Dicas */}
        {estado === 'capturando' && (
          <div className="mt-6 bg-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3 text-blue-900">
              Dicas para melhor reconhecimento:
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">💡</span>
                <span>Procure um local bem iluminado</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">👤</span>
                <span>Mantenha o rosto centralizado no círculo</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🚫</span>
                <span>Evite usar óculos escuros ou acessórios que cubram o rosto</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📷</span>
                <span>Olhe diretamente para a câmera</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Modal de Cadastro de Referência */}
      <ModalCadastroReferencia
        isOpen={modalCadastroAberto}
        onClose={() => {
          setModalCadastroAberto(false);
          setEstado('capturando');
          setImagemCapturada(null);
          iniciarCamera();
        }}
        onConfirm={salvarComoReferencia}
        imagemPreview={imagemCapturada || undefined}
        processo={processo || ''}
      />
    </div>
  );
}