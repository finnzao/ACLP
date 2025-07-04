// painel-web/components/ModalCadastroReferencia.tsx
import { AlertCircle, Camera, Save, X } from 'lucide-react';

interface ModalCadastroReferenciaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  imagemPreview?: string;
  processo: string;
}

export default function ModalCadastroReferencia({
  isOpen,
  onClose,
  onConfirm,
  imagemPreview,
  processo
}: ModalCadastroReferenciaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Nenhum Cadastro Facial Encontrado
          </h2>
          
          <p className="text-gray-600">
            Não há foto de referência para o processo:
          </p>
          <p className="font-mono text-sm bg-gray-100 px-3 py-1 rounded inline-block mt-1">
            {processo}
          </p>
        </div>

        {imagemPreview && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center">
              Foto capturada:
            </p>
            <div className="relative rounded-lg overflow-hidden bg-gray-100 mx-auto" style={{ maxWidth: '200px' }}>
              <img
                src={imagemPreview}
                alt="Foto capturada"
                className="w-full h-auto"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Deseja usar esta foto como referência?</strong>
          </p>
          <p className="text-sm text-blue-700 mt-1">
            A foto será salva e o comparecimento de hoje será registrado automaticamente.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar como Referência
          </button>
        </div>
      </div>
    </div>
  );
}