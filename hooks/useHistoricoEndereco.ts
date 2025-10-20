/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo } from 'react';
import { httpClient } from '@/lib/http/client';
import { useToast } from '@/components/Toast';

export interface HistoricoEnderecoItem {
    id: number;
    pessoaId?: number;
    custodiadoId?: number;
    cep: string;
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    dataInicio: string;
    dataFim?: string | null;
    motivoAlteracao?: string;
    validadoPor?: string;
    historicoComparecimentoId?: number;
    criadoEm: string;
    atualizadoEm?: string | null;
    version?: number;
    enderecoCompleto: string;
    enderecoResumido: string;
    nomeEstado: string;
    regiaoEstado: string;
    periodoResidencia: string;
    diasResidencia: number;
    enderecoAtivo: boolean;
    ativo?: boolean; // Backend pode retornar "ativo" ao invés de "enderecoAtivo"
}

interface UseHistoricoEnderecoReturn {
    historico: HistoricoEnderecoItem[];
    loading: boolean;
    error: string | null;
    buscarHistorico: (custodiadoId: number) => Promise<void>;
    enderecoAtual: HistoricoEnderecoItem | null;
    totalEnderecos: number;
}

export function useHistoricoEndereco(): UseHistoricoEnderecoReturn {
    const [historico, setHistorico] = useState<HistoricoEnderecoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const buscarHistorico = useCallback(async (custodiadoId: number) => {
        if (!custodiadoId || custodiadoId <= 0) {
            setError('ID do custodiado inválido');
            setHistorico([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('[useHistoricoEndereco] Buscando histórico para custodiado:', custodiadoId);

            const response = await httpClient.get<any>(
                `/historico-enderecos/pessoa/${custodiadoId}`
            );

            console.log('[useHistoricoEndereco] Resposta recebida:', response);

            if (response.success) {
                let historicoData: HistoricoEnderecoItem[] = [];

                // Tratar diferentes estruturas de resposta
                if (Array.isArray(response.data)) {
                    historicoData = response.data;
                } else if (response.data && Array.isArray(response.data.data)) {
                    historicoData = response.data.data;
                } else if (response.data && typeof response.data === 'object') {
                    // Se for um objeto único, transformar em array
                    historicoData = [response.data];
                }

                // Normalizar dados (backend pode retornar "ativo" ou "enderecoAtivo")
                const historicoNormalizado = historicoData.map(item => ({
                    ...item,
                    enderecoAtivo: item.enderecoAtivo ?? item.ativo ?? false,
                    custodiadoId: item.custodiadoId ?? item.pessoaId,
                    pessoaId: item.pessoaId ?? item.custodiadoId
                }));

                setHistorico(historicoNormalizado);
                console.log('[useHistoricoEndereco] Histórico carregado:', historicoNormalizado.length, 'registros');
            } else {
                throw new Error(response.message || 'Erro ao buscar histórico');
            }
        } catch (err: any) {
            const errorMsg = err.message || 'Erro ao buscar histórico de endereços';
            console.error('[useHistoricoEndereco] Erro:', err);
            setError(errorMsg);
            setHistorico([]);
            showToast({
                type: 'error',
                title: 'Erro ao buscar histórico',
                message: errorMsg,
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // Usar useMemo para evitar recalcular a cada render
    const enderecoAtual = useMemo(() => {
        if (!Array.isArray(historico) || historico.length === 0) {
            return null;
        }
        return historico.find(h => h.enderecoAtivo === true || h.ativo === true) || null;
    }, [historico]);

    const totalEnderecos = useMemo(() => {
        return Array.isArray(historico) ? historico.length : 0;
    }, [historico]);

    return {
        historico: Array.isArray(historico) ? historico : [],
        loading,
        error,
        buscarHistorico,
        enderecoAtual,
        totalEnderecos
    };
}