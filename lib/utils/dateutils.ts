/* eslint-disable @typescript-eslint/no-unused-vars */
// dateutils.ts

/**
 * Converte uma string de data (YYYY-MM-DD) para um objeto Date sem problemas de timezone
 * @param dateString - String no formato "YYYY-MM-DD"
 * @returns Date object na timezone local
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formata um objeto Date para string no formato YYYY-MM-DD (data local)
 * @param date - Objeto Date
 * @returns String no formato "YYYY-MM-DD"
 */
export function formatToLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma string de data (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
 * @param dateString - String no formato "YYYY-MM-DD"
 * @returns String no formato "DD/MM/YYYY"
 */
export function formatToBrazilianDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = parseLocalDate(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data para exibição com dia da semana em português
 * @param dateString - String no formato "YYYY-MM-DD"
 * @returns String formatada com dia da semana
 */
export function formatWithWeekday(dateString: string): string {
  if (!dateString) return '';
  
  const date = parseLocalDate(dateString);
  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const weekday = weekdays[date.getDay()];
  
  return `${weekday}, ${formatToBrazilianDate(dateString)}`;
}

/**
 * Converte Date para o formato aceito pelo input type="date" (YYYY-MM-DD)
 * @param date - Objeto Date
 * @returns String no formato "YYYY-MM-DD"
 */
export function toInputDateValue(date: Date): string {
  return formatToLocalDateString(date);
}

/**
 * Obtém a data atual no formato YYYY-MM-DD
 * @returns String com data atual
 */
export function getTodayDateString(): string {
  return formatToLocalDateString(new Date());
}

// ========== NOVAS FUNÇÕES PARA TIMESTAMPS ==========

/**
 * Extrai apenas a data (YYYY-MM-DD) de um timestamp ISO 8601
 * @param timestamp - String no formato "2025-11-04T18:52:51.617163" ou ISO completo
 * @returns String no formato "YYYY-MM-DD" ou string vazia se inválido
 * 
 * @example
 * extractDateFromTimestamp("2025-11-04T18:52:51.617163") // "2025-11-04"
 * extractDateFromTimestamp("2025-11-04T18:52:51Z") // "2025-11-04"
 */
export function extractDateFromTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  
  // Extrai a parte da data antes do 'T'
  const datePart = timestamp.split('T')[0];
  
  // Valida se está no formato correto YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  
  return '';
}

/**
 * Converte timestamp ISO 8601 para formato brasileiro (DD/MM/YYYY)
 * @param timestamp - String no formato "2025-11-04T18:52:51.617163" ou ISO completo
 * @returns String no formato "DD/MM/YYYY"
 * 
 * @example
 * formatTimestampToBrazilian("2025-11-04T18:52:51.617163") // "04/11/2025"
 */
export function formatTimestampToBrazilian(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  
  const dateOnly = extractDateFromTimestamp(timestamp);
  return formatToBrazilianDate(dateOnly);
}

/**
 * Converte timestamp ISO 8601 para formato brasileiro completo com hora
 * @param timestamp - String no formato "2025-11-04T18:52:51.617163" ou ISO completo
 * @returns String no formato "DD/MM/YYYY às HH:mm"
 * 
 * @example
 * formatTimestampToBrazilianFull("2025-11-04T18:52:51.617163") // "04/11/2025 às 18:52"
 */
export function formatTimestampToBrazilianFull(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
}

/**
 * Converte timestamp ISO 8601 para objeto Date
 * @param timestamp - String no formato "2025-11-04T18:52:51.617163" ou ISO completo
 * @returns Date object ou null se inválido
 * 
 * @example
 * parseTimestamp("2025-11-04T18:52:51.617163") // Date object
 */
export function parseTimestamp(timestamp: string | null | undefined): Date | null {
  if (!timestamp) return null;
  
  try {
    const date = new Date(timestamp);
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    return null;
  }
}

/**
 * Formata timestamp para exibição relativa (há X horas/dias)
 * @param timestamp - String no formato "2025-11-04T18:52:51.617163" ou ISO completo
 * @returns String formatada relativamente
 * 
 * @example
 * formatTimestampRelative("2025-11-04T18:52:51.617163") // "há 2 horas"
 * formatTimestampRelative("2025-11-03T18:52:51.617163") // "há 1 dia"
 */
export function formatTimestampRelative(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  
  const date = parseTimestamp(timestamp);
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) {
    return 'agora mesmo';
  } else if (diffMinutes < 60) {
    return `há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHours < 24) {
    return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffDays < 30) {
    return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  } else {
    // Para mais de 30 dias, mostra a data completa
    return formatTimestampToBrazilian(timestamp);
  }
}

/**
 * Verifica se um timestamp é de hoje
 * @param timestamp - String no formato "2025-11-04T18:52:51.617163" ou ISO completo
 * @returns Boolean indicando se é de hoje
 */
export function isTimestampToday(timestamp: string | null | undefined): boolean {
  if (!timestamp) return false;
  
  const date = parseTimestamp(timestamp);
  if (!date) return false;
  
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Extrai apenas a hora (HH:mm) de um timestamp
 * @param timestamp - String no formato "2025-11-04T18:52:51.617163" ou ISO completo
 * @returns String no formato "HH:mm"
 * 
 * @example
 * extractTimeFromTimestamp("2025-11-04T18:52:51.617163") // "18:52"
 */
export function extractTimeFromTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return '';
  
  const date = parseTimestamp(timestamp);
  if (!date) return '';
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}