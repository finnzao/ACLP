'use client';

import React, { useRef, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { INPUT_MASKS,  type MaskedInputProps } from '@/lib/utils/inputFormatters';
import { ValidationCPF } from '@/lib/utils/validation';
export function MaskedInput({
    mask,
    value,
    onChange,
    error = false,
    showCounter = false,
    className = '',
    disabled = false,
    ...props
}: MaskedInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const maskConfig = INPUT_MASKS[mask];
    const [isComplete, setIsComplete] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    // Verificar se o campo está completo e válido
    useEffect(() => {
        const cleanValue = value.replace(/\D/g, '');

        if (mask === 'processo') {
            // Processo CNJ tem exatamente 20 dígitos
            setIsComplete(cleanValue.length === 20);
            setIsValid(cleanValue.length === 20 ? true : null);
        } else if (mask === 'cpf') {
            setIsComplete(cleanValue.length === 11);
            setIsValid(cleanValue.length === 11 ? ValidationCPF(value) : null);
        } else if (mask === 'telefone') {
            setIsComplete(cleanValue.length >= 10);
            setIsValid(cleanValue.length >= 10 ? true : null);
        } else if (mask === 'cep') {
            setIsComplete(cleanValue.length === 8);
            setIsValid(cleanValue.length === 8 ? true : null);
        } else if (mask === 'rg') {
            setIsComplete(cleanValue.length >= 7);
            setIsValid(cleanValue.length >= 7 ? true : null);
        } else {
            setIsComplete(value.length === maskConfig.maxLength);
            setIsValid(null);
        }
    }, [value, mask, maskConfig.maxLength]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        // Previne teclas não permitidas
        if (maskConfig.keyValidator && !maskConfig.keyValidator(event)) {
            event.preventDefault();

            // Feedback visual suave de tecla bloqueada
            if (inputRef.current) {
                inputRef.current.style.backgroundColor = '#fef2f2';
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.style.backgroundColor = '';
                    }
                }, 100);
            }
        }

        // Bloqueia input se já atingiu o limite
        if (
            value.length >= maskConfig.maxLength &&
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            inputRef.current?.selectionStart === inputRef.current?.selectionEnd
        ) {
            event.preventDefault();
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = maskConfig.format(event.target.value);

        // Só atualiza se não exceder o limite
        if (formatted.length <= maskConfig.maxLength) {
            onChange(formatted);
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const pastedText = event.clipboardData.getData('text');
        const formatted = maskConfig.format(pastedText);

        if (formatted.length <= maskConfig.maxLength) {
            onChange(formatted);
        }
    };

    // Determinar cor do indicador baseado no estado
    const getStatusColor = () => {
        if (error) return 'text-red-500';
        if (isComplete && isValid === true) return 'text-green-500';
        if (isComplete && isValid === false) return 'text-red-500';
        return 'text-gray-400';
    };

    // Determinar ícone baseado no estado
    const getStatusIcon = () => {
        if (error && !isComplete) return <AlertCircle className="w-4 h-4 text-red-500" />;
        if (isComplete && isValid === true) return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (isComplete && isValid === false) return <AlertCircle className="w-4 h-4 text-red-500" />;
        if (mask === 'processo' && value.length > 0 && !isComplete) {
            return <Info className="w-4 h-4 text-blue-400" />;
        }
        return null;
    };

    // Estilo dinâmico baseado no estado
    const inputClassName = `
    w-full px-4 py-3 border rounded-lg transition-all duration-200
    focus:ring-2 focus:ring-primary focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-red-300 bg-red-50' :
            isComplete && isValid === false ? 'border-red-300 bg-red-50' :
                isComplete && isValid === true ? 'border-green-300 bg-green-50' :
                    'border-gray-300'}
    ${className}
  `;

    // Contador de caracteres
    const characterCount = value.length;
    const maxCharacters = maskConfig.maxLength;
    const percentage = (characterCount / maxCharacters) * 100;

    // Mensagem de progresso para processo
    const getProgressMessage = () => {
        if (mask === 'processo') {
            const cleanValue = value.replace(/\D/g, '');
            const remaining = 20 - cleanValue.length;
            if (remaining > 0) {
                return `${remaining} dígito${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`;
            }
            return 'Completo';
        }
        return null;
    };

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className={inputClassName}
                placeholder={maskConfig.placeholder}
                maxLength={maskConfig.maxLength}
                pattern={maskConfig.pattern}
                inputMode={maskConfig.inputMode}
                disabled={disabled}
                autoComplete="off"
                spellCheck={false}
                {...props}
            />

            {/* Indicador de status no canto direito */}
            {!disabled && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {/* Contador de caracteres ou mensagem de progresso */}
                    {showCounter && (
                        <span className={`text-xs ${getStatusColor()}`}>
                            {getProgressMessage() || `${characterCount}/${maxCharacters}`}
                        </span>
                    )}

                    {/* Ícone de status */}
                    {getStatusIcon()}
                </div>
            )}

            {/* Barra de progresso (opcional) - com cores apropriadas */}
            {showCounter && !disabled && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 rounded-b-lg overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${isComplete && isValid === true ? 'bg-green-500' :
                                isComplete && isValid === false ? 'bg-red-500' :
                                    percentage > 90 ? 'bg-blue-500' :
                                        percentage > 70 ? 'bg-blue-400' :
                                            'bg-blue-300'
                            }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            )}
        </div>
    );
}

// Componente wrapper para grupos de input com label
export interface MaskedInputFieldProps extends MaskedInputProps {
    label: string;
    required?: boolean;
    errorMessage?: string;
    helperText?: string;
    successText?: string;
}

export function MaskedInputField({
    label,
    required = false,
    errorMessage,
    helperText,
    successText,
    mask,
    value,
    ...inputProps
}: MaskedInputFieldProps) {
    const [showSuccess, setShowSuccess] = useState(false);

    // Verificar se deve mostrar mensagem de sucesso
    useEffect(() => {
        const cleanValue = value.replace(/\D/g, '');

        if (mask === 'processo') {
            setShowSuccess(cleanValue.length === 20 && !errorMessage);
        } else if (mask === 'cpf') {
            setShowSuccess(cleanValue.length === 11 && ValidationCPF(value) && !errorMessage);
        } else if (mask === 'telefone') {
            setShowSuccess(cleanValue.length >= 10 && !errorMessage);
        } else if (mask === 'cep') {
            setShowSuccess(cleanValue.length === 8 && !errorMessage);
        } else {
            setShowSuccess(false);
        }
    }, [value, mask, errorMessage]);

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <MaskedInput mask={mask} value={value} {...inputProps} error={!!errorMessage} />

            {/* Mensagens de feedback */}
            <div className="mt-1 space-y-1">
                {errorMessage && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errorMessage}
                    </p>
                )}

                {!errorMessage && showSuccess && successText && (
                    <p className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {successText}
                    </p>
                )}

                {!errorMessage && !showSuccess && helperText && (
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {helperText}
                    </p>
                )}

                {/* Mensagem específica para processo */}
                {mask === 'processo' && value.length > 0 && !showSuccess && !errorMessage && (
                    <p className="text-blue-500 text-xs">
                        Continue digitando para completar o número do processo
                    </p>
                )}
            </div>
        </div>
    );
}