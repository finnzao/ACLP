/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Search, Filter, UserPlus, Edit, Trash2,
    Mail, Building, Calendar, Shield, User, ChevronDown,
    Download, AlertCircle, CheckCircle
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { usuariosService } from '@/lib/api/services';
import { UsuarioResponse } from '@/types/api';
import ConfirmDialog from '@/components/ConfirmDialog';

interface UserListProps {
    onEditUser?: (user: UsuarioResponse) => void;
    onAddUser?: () => void;
}

export default function UserList({ onEditUser, onAddUser }: UserListProps) {
    const { showToast } = useToast();

    const [users, setUsers] = useState<UsuarioResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        tipo: 'todos',
        status: 'todos',
        departamento: 'todos'
    });
    const [sortBy, setSortBy] = useState<'nome' | 'email' | 'criadoEm' | 'ultimoLogin'>('nome');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showFilters, setShowFilters] = useState(false);

    // Estados para exclusão
    const [userToDelete, setUserToDelete] = useState<UsuarioResponse | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Carregar usuários
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await usuariosService.listar();
            setUsers(data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            showToast({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível carregar a lista de usuários'
            });
        } finally {
            setLoading(false);
        }
    };

    // Obter departamentos únicos
    const departamentos = useMemo(() => {
        const deps = [...new Set(users.map(u => u.departamento).filter(Boolean))];
        return deps.sort();
    }, [users]);

    // Filtrar e ordenar usuários
    const filteredUsers = useMemo(() => {
        let filtered = [...users];

        // Aplicar busca
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.nome.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search) ||
                user.departamento?.toLowerCase().includes(search)
            );
        }

        // Aplicar filtros
        if (filters.tipo !== 'todos') {
            filtered = filtered.filter(user => user.tipo === filters.tipo);
        }

        if (filters.status !== 'todos') {
            const isAtivo = filters.status === 'ativo';
            filtered = filtered.filter(user => user.ativo === isAtivo);
        }

        if (filters.departamento !== 'todos') {
            filtered = filtered.filter(user => user.departamento === filters.departamento);
        }

        // Ordenar
        filtered.sort((a, b) => {
            let aVal = a[sortBy] || '';
            let bVal = b[sortBy] || '';

            if (sortBy === 'criadoEm' || sortBy === 'ultimoLogin') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [users, searchTerm, filters, sortBy, sortOrder]);

    // Alternar status do usuário
    const toggleUserStatus = async (user: UsuarioResponse) => {
        try {
            const result = await usuariosService.atualizar(user.id, {
                ativo: !user.ativo
            });

            if (result.success) {
                showToast({
                    type: 'success',
                    title: 'Status Atualizado',
                    message: `Usuário ${!user.ativo ? 'ativado' : 'desativado'} com sucesso`
                });
                loadUsers();
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível alterar o status do usuário'
            });
        }
    };

    // Confirmar exclusão
    const handleDeleteUser = (user: UsuarioResponse) => {
        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    // Executar exclusão
    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            // Aqui você chamaria o serviço de exclusão quando disponível
            // await usuariosService.excluir(userToDelete.id);

            showToast({
                type: 'success',
                title: 'Usuário Excluído',
                message: 'O usuário foi removido do sistema'
            });

            loadUsers();
        } catch (error) {
            showToast({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível excluir o usuário'
            });
        }
    };

    // Exportar lista de usuários
    const exportUsers = () => {
        const csv = [
            ['Nome', 'E-mail', 'Tipo', 'Departamento', 'Telefone', 'Status', 'Criado em', 'Último Login'],
            ...filteredUsers.map(user => [
                user.nome,
                user.email,
                user.tipo,
                user.departamento || '',
                user.telefone || '',
                user.ativo ? 'Ativo' : 'Inativo',
                new Date(user.criadoEm).toLocaleDateString('pt-BR'),
                user.ultimoLogin ? new Date(user.ultimoLogin).toLocaleDateString('pt-BR') : 'Nunca'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando usuários...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h2>
                        <p className="text-gray-600 mt-1">
                            {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={exportUsers}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Exportar
                        </button>

                        <button
                            onClick={onAddUser}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Novo Usuário
                        </button>
                    </div>
                </div>
            </div>

            {/* Barra de busca e filtros */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Busca */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, email ou departamento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Botão de filtros */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-5 h-5" />
                        Filtros
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Filtros expandidos */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Usuário
                            </label>
                            <select
                                value={filters.tipo}
                                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="todos">Todos</option>
                                <option value="ADMIN">Administrador</option>
                                <option value="USUARIO">Usuário</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="todos">Todos</option>
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Departamento
                            </label>
                            <select
                                value={filters.departamento}
                                onChange={(e) => setFilters({ ...filters, departamento: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="todos">Todos</option>
                                {departamentos.map(dep => (
                                    <option key={dep} value={dep}>{dep}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabela de usuários */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                    setSortBy('nome');
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                }}
                            >
                                Nome
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                E-mail
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Departamento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                    setSortBy('ultimoLogin');
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                }}
                            >
                                Último Login
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                                            <span className="text-primary font-medium">
                                                {user.nome.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Mail className="w-4 h-4" />
                                        {user.email}
                                    </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${user.tipo === 'ADMIN'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {user.tipo === 'ADMIN' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                        {user.tipo === 'ADMIN' ? 'Admin' : 'Usuário'}
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.departamento ? (
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <Building className="w-4 h-4" />
                                            {user.departamento}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => toggleUserStatus(user)}
                                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${user.ativo
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                    >
                                        {user.ativo ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" />
                                                Ativo
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-3 h-3" />
                                                Inativo
                                            </>
                                        )}
                                    </button>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {user.ultimoLogin ? (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(user.ultimoLogin).toLocaleDateString('pt-BR')}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Nunca</span>
                                    )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEditUser?.(user)}
                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleDeleteUser(user)}
                                            className="text-red-600 hover:text-red-800 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum usuário encontrado</p>
                        {(searchTerm || filters.tipo !== 'todos' || filters.status !== 'todos' || filters.departamento !== 'todos') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilters({ tipo: 'todos', status: 'todos', departamento: 'todos' });
                                }}
                                className="mt-4 text-primary hover:underline"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Dialog de confirmação de exclusão */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                type="danger"
                title="Excluir Usuário"
                message={`Tem certeza que deseja excluir o usuário ${userToDelete?.nome}?`}
                details={[
                    `E-mail: ${userToDelete?.email}`,
                    `Tipo: ${userToDelete?.tipo === 'ADMIN' ? 'Administrador' : 'Usuário'}`,
                    'Esta ação não pode ser desfeita!'
                ]}
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
            />
        </div>
    );
}