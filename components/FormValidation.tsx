/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';

interface ValidationMessageProps {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  className?: string;
}

export function ValidationMessage({ type, message, className = '' }: ValidationMessageProps) {
  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info
  };

  const colors = {
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    success: 'text-green-700 bg-green-50 border-green-200',
    info: 'text-blue-700 bg-blue-50 border-blue-200'
  };

  const iconColors = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    info: 'text-blue-500'
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-start gap-2 p-3 border rounded-lg ${colors[type]} ${className}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColors[type]}`} />
      <span className="text-sm">{message}</span>
    </div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  errors?: Record<string, string>;
  warnings?: Record<string, string>;
  className?: string;
}

export function FormSection({ 
  title, 
  description, 
  icon, 
  children, 
  errors = {}, 
  warnings = {},
  className = '' 
}: FormSectionProps) {
  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(warnings).length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 space-y-4 ${className}`}>
      {/* Header da seção */}
      <div className="flex items-center gap-3 mb-6">
        {icon && (
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>

      {/* Alertas de erro gerais */}
      {hasErrors && (
        <div className="space-y-2">
          {Object.entries(errors).map(([field, error]) => (
            <ValidationMessage key={field} type="error" message={error} />
          ))}
        </div>
      )}

      {/* Alertas de aviso gerais */}
      {hasWarnings && (
        <div className="space-y-2">
          {Object.entries(warnings).map(([field, warning]) => (
            <ValidationMessage key={field} type="warning" message={warning} />
          ))}
        </div>
      )}

      {/* Conteúdo da seção */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  warning?: string;
  success?: string;
  info?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ 
  label, 
  required = false, 
  error, 
  warning, 
  success, 
  info, 
  children, 
  className = '' 
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {children}
      
      {/* Mensagens de validação */}
      <div className="mt-1 space-y-1">
        {error && (
          <p className="text-red-500 text-sm flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
        {warning && (
          <p className="text-yellow-600 text-sm flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {warning}
          </p>
        )}
        {success && (
          <p className="text-green-600 text-sm flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {success}
          </p>
        )}
        {info && (
          <p className="text-blue-600 text-sm flex items-center gap-1">
            <Info className="w-3 h-3" />
            {info}
          </p>
        )}
      </div>
    </div>
  );
}

interface RequiredFieldsIndicatorProps {
  fields: { name: string; label: string; filled: boolean }[];
  className?: string;
}

export function RequiredFieldsIndicator({ fields, className = '' }: RequiredFieldsIndicatorProps) {
  const totalFields = fields.length;
  const filledFields = fields.filter(f => f.filled).length;
  const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  
  const missingFields = fields.filter(f => !f.filled);

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-blue-900">
          Campos Obrigatórios
        </h4>
        <span className="text-sm text-blue-700">
          {filledFields}/{totalFields} ({percentage}%)
        </span>
      </div>
      
      {/* Barra de progresso */}
      <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Lista de campos pendentes */}
      {missingFields.length > 0 && (
        <div>
          <p className="text-sm text-blue-800 mb-2">Campos pendentes:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            {missingFields.map(field => (
              <li key={field.name} className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                {field.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {filledFields === totalFields && (
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Todos os campos obrigatórios preenchidos!</span>
        </div>
      )}
    </div>
  );
}

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: { label: string; description?: string }[];
  className?: string;
}

export function FormProgress({ currentStep, totalSteps, steps, className = '' }: FormProgressProps) {
  return (
    <div className={className}>
      {/* Barra de progresso */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isAccessible = stepNumber <= currentStep;
          
          return (
            <div key={index} className="flex-1 flex items-center">
              {/* Círculo do step */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-primary text-white' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
              </div>
              
              {/* Linha conectora (exceto no último) */}
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2
                  ${stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                `} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Labels dos steps */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          
          return (
            <div key={index} className="flex-1 text-center">
              <div className={`text-sm font-medium ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`}>
                {step.label}
              </div>
              {step.description && (
                <div className="text-xs text-gray-400 mt-1">
                  {step.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ConditionalFieldProps {
  condition: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  animation?: boolean;
}

export function ConditionalField({ 
  condition, 
  children, 
  fallback = null, 
  animation = true 
}: ConditionalFieldProps) {
  if (!condition) {
    return <>{fallback}</>;
  }

  return (
    <div className={animation ? 'animate-in slide-in-from-top-2 duration-200' : ''}>
      {children}
    </div>
  );
}

// Hook para validação de formulário
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validators: Record<keyof T, (value: any, formData: T) => string | null>
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validateField = (field: keyof T, value: any) => {
    const validator = validators[field];
    const error = validator ? validator(value, data) : null;
    
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
    
    return !error;
  };

  const validateAll = () => {
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;
    let isValid = true;
    
    Object.keys(validators).forEach(field => {
      const fieldKey = field as keyof T;
      const error = validators[fieldKey](data[fieldKey], data);
      if (error) {
        newErrors[fieldKey] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const updateField = (field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const reset = () => {
    setData(initialData);
    setErrors({} as Record<keyof T, string>);
    setTouched({} as Record<keyof T, boolean>);
  };

  return {
    data,
    errors,
    touched,
    updateField,
    validateField,
    validateAll,
    reset,
    isFieldValid: (field: keyof T) => !errors[field],
    hasErrors: Object.values(errors).some(error => !!error)
  };
}