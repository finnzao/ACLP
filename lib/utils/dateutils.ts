/**
 * Utilitários para manipulação de datas
 * Resolve problemas de timezone ao trabalhar com datas no formato ISO (YYYY-MM-DD)
 * 
 * @module dateUtils
 * @description Biblioteca centralizada para tratamento de datas em toda a aplicação
 */

/**
 * Cria um objeto Date a partir de uma string ISO garantindo o timezone local
 * @param dateStr - String de data no formato ISO (YYYY-MM-DD) ou ISO completo
 * @returns Date object no timezone local
 * @throws Error se a string de data for inválida
 */
export function parseLocalDate(dateStr: string): Date {
    if (!dateStr) {
      throw new Error('Data inválida: string vazia ou nula');
    }
  
    // Se for uma data no formato ISO simples (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      // Cria a data no timezone local ao meio-dia para evitar problemas
      return new Date(year, month - 1, day, 12, 0, 0);
    }
  
    // Se for uma data com hora, adiciona T12:00:00 se não tiver hora
    if (!dateStr.includes('T')) {
      return new Date(dateStr + 'T12:00:00');
    }
  
    // Caso contrário, usa o construtor padrão
    return new Date(dateStr);
  }
  
  /**
   * Formata uma data para o padrão brasileiro (DD/MM/AAAA)
   * @param date - String de data ISO, objeto Date ou null/undefined
   * @param defaultValue - Valor padrão quando a data é inválida
   * @returns String formatada em pt-BR
   */
  export function formatDateToBR(
    date: string | Date | null | undefined,
    defaultValue: string = 'Não informado'
  ): string {
    if (!date) return defaultValue;
  
    try {
      const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
      return dateObj.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return defaultValue;
    }
  }
  
  /**
   * Formata uma data e hora para o padrão brasileiro
   * @param datetime - String de datetime ISO ou objeto Date
   * @param defaultValue - Valor padrão quando a data é inválida
   * @returns String formatada em pt-BR com hora
   */
  export function formatDateTimeToBR(
    datetime: string | Date | null | undefined,
    defaultValue: string = 'Não informado'
  ): string {
    if (!datetime) return defaultValue;
  
    try {
      const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
      return dateObj.toLocaleString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data e hora:', error);
      return defaultValue;
    }
  }
  
  /**
   * Formata uma hora para o padrão brasileiro (HH:MM)
   * @param datetime - String de datetime ISO ou objeto Date
   * @param defaultValue - Valor padrão quando a data é inválida
   * @returns String de hora formatada
   */
  export function formatTimeToBR(
    datetime: string | Date | null | undefined,
    defaultValue: string = 'Não informado'
  ): string {
    if (!datetime) return defaultValue;
  
    try {
      const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
      return dateObj.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Erro ao formatar hora:', error);
      return defaultValue;
    }
  }
  
  /**
   * Retorna a data atual no formato ISO (YYYY-MM-DD)
   * @returns String de data no formato ISO
   */
  export function getCurrentDateISO(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Retorna a data e hora atual no formato ISO completo
   * @returns String de datetime no formato ISO
   */
  export function getCurrentDateTimeISO(): string {
    return new Date().toISOString();
  }
  
  /**
   * Verifica se uma data é hoje
   * @param dateStr - String de data no formato ISO
   * @returns boolean indicando se é hoje
   */
  export function isToday(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    
    try {
      const hoje = new Date();
      const data = parseLocalDate(dateStr);
      
      return (
        data.getDate() === hoje.getDate() &&
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      );
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Verifica se uma data está no passado (vencida/atrasada)
   * @param dateStr - String de data no formato ISO
   * @returns boolean indicando se está vencida
   */
  export function isOverdue(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const data = parseLocalDate(dateStr);
      data.setHours(0, 0, 0, 0);
      
      return data < hoje;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Verifica se uma data está no futuro
   * @param dateStr - String de data no formato ISO
   * @returns boolean indicando se está no futuro
   */
  export function isFuture(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const data = parseLocalDate(dateStr);
      data.setHours(0, 0, 0, 0);
      
      return data > hoje;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Calcula a diferença em dias entre uma data e hoje
   * @param dateStr - String de data no formato ISO
   * @returns Número de dias (negativo se for passado, positivo se for futuro)
   */
  export function getDaysUntil(dateStr: string | null | undefined): number {
    if (!dateStr) return 0;
    
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const data = parseLocalDate(dateStr);
      data.setHours(0, 0, 0, 0);
      
      const diffTime = data.getTime() - hoje.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Calcula a diferença absoluta em dias entre uma data e hoje
   * @param dateStr - String de data no formato ISO
   * @returns Número absoluto de dias de diferença
   */
  export function getDaysAgo(dateStr: string | null | undefined): number {
    return Math.abs(getDaysUntil(dateStr));
  }
  
  /**
   * Calcula a diferença entre duas datas em dias
   * @param startDate - Data inicial
   * @param endDate - Data final
   * @returns Número de dias entre as datas
   */
  export function getDaysBetween(
    startDate: string | Date,
    endDate: string | Date
  ): number {
    try {
      const start = typeof startDate === 'string' ? parseLocalDate(startDate) : startDate;
      const end = typeof endDate === 'string' ? parseLocalDate(endDate) : endDate;
      
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      const diffTime = end.getTime() - start.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Verifica se uma data está dentro de um período futuro
   * @param dateStr - String de data no formato ISO
   * @param days - Número de dias para verificar
   * @returns boolean indicando se está dentro do período
   */
  export function isWithinDays(
    dateStr: string | null | undefined,
    days: number
  ): boolean {
    if (!dateStr) return false;
    
    const daysUntil = getDaysUntil(dateStr);
    return daysUntil >= 0 && daysUntil <= days;
  }
  
  /**
   * Formata uma data relativa (hoje, amanhã, em X dias, há X dias)
   * @param dateStr - String de data no formato ISO
   * @param showFullDate - Se deve mostrar a data completa também
   * @returns String com descrição relativa
   */
  export function formatRelativeDate(
    dateStr: string | null | undefined,
    showFullDate: boolean = false
  ): string {
    if (!dateStr) return 'Não informado';
    
    try {
      const days = getDaysUntil(dateStr);
      const formattedDate = formatDateToBR(dateStr);
      
      let relative = '';
      
      if (days === 0) {
        relative = 'Hoje';
      } else if (days === 1) {
        relative = 'Amanhã';
      } else if (days === -1) {
        relative = 'Ontem';
      } else if (days > 0) {
        relative = `Em ${days} dias`;
      } else {
        relative = `Há ${Math.abs(days)} dias`;
      }
      
      return showFullDate ? `${relative} (${formattedDate})` : relative;
    } catch (error) {
      return formatDateToBR(dateStr);
    }
  }
  
  /**
   * Adiciona dias a uma data
   * @param dateStr - String de data no formato ISO ou objeto Date
   * @param days - Número de dias para adicionar (pode ser negativo)
   * @returns String de data no formato ISO
   */
  export function addDays(
    dateStr: string | Date,
    days: number
  ): string {
    const date = typeof dateStr === 'string' ? parseLocalDate(dateStr) : new Date(dateStr);
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Adiciona meses a uma data
   * @param dateStr - String de data no formato ISO ou objeto Date
   * @param months - Número de meses para adicionar (pode ser negativo)
   * @returns String de data no formato ISO
   */
  export function addMonths(
    dateStr: string | Date,
    months: number
  ): string {
    const date = typeof dateStr === 'string' ? parseLocalDate(dateStr) : new Date(dateStr);
    date.setMonth(date.getMonth() + months);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Interface para o retorno do status de urgência
   */
  export interface DateUrgencyStatus {
    status: 'overdue' | 'today' | 'soon' | 'normal' | 'invalid';
    label: string;
    color: string;
    priority: number;
  }
  
  /**
   * Retorna o status de urgência de uma data
   * @param dateStr - String de data no formato ISO
   * @returns Objeto com status e descrição
   */
  export function getDateUrgencyStatus(
    dateStr: string | null | undefined
  ): DateUrgencyStatus {
    if (!dateStr) {
      return {
        status: 'invalid',
        label: 'Não informado',
        color: 'gray',
        priority: 0
      };
    }
  
    if (isOverdue(dateStr)) {
      const days = getDaysAgo(dateStr);
      return {
        status: 'overdue',
        label: `${days} dias de atraso`,
        color: 'red',
        priority: 4
      };
    }
  
    if (isToday(dateStr)) {
      return {
        status: 'today',
        label: 'Hoje',
        color: 'yellow',
        priority: 3
      };
    }
  
    const days = getDaysUntil(dateStr);
    
    if (days <= 7) {
      return {
        status: 'soon',
        label: `${days} dias`,
        color: 'blue',
        priority: 2
      };
    }
  
    return {
      status: 'normal',
      label: formatDateToBR(dateStr),
      color: 'green',
      priority: 1
    };
  }
  
  /**
   * Valida se uma string é uma data válida
   * @param dateStr - String para validar
   * @returns boolean indicando se é válida
   */
  export function isValidDate(dateStr: string): boolean {
    if (!dateStr) return false;
    
    // Verifica formato ISO básico
    if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return false;
    }
    
    try {
      const date = parseLocalDate(dateStr);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }
  
  /**
   * Valida se uma string é uma data válida no formato brasileiro
   * @param dateStr - String para validar (DD/MM/AAAA)
   * @returns boolean indicando se é válida
   */
  export function isValidDateBR(dateStr: string): boolean {
    if (!dateStr) return false;
    
    // Verifica formato brasileiro
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return false;
    }
    
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    return !isNaN(date.getTime()) && 
           date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
  }
  
  /**
   * Converte uma data do formato brasileiro para ISO
   * @param dateBR - String de data no formato DD/MM/AAAA
   * @returns String de data no formato ISO (YYYY-MM-DD)
   * @throws Error se o formato for inválido
   */
  export function parseBRToISO(dateBR: string): string {
    if (!isValidDateBR(dateBR)) {
      throw new Error('Formato de data brasileiro inválido. Use DD/MM/AAAA');
    }
    
    const [day, month, year] = dateBR.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  /**
   * Compara duas datas
   * @param date1 - Primeira data
   * @param date2 - Segunda data
   * @returns -1 se date1 < date2, 0 se iguais, 1 se date1 > date2
   */
  export function compareDates(
    date1: string | Date,
    date2: string | Date
  ): number {
    const d1 = typeof date1 === 'string' ? parseLocalDate(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseLocalDate(date2) : date2;
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  }
  
  /**
   * Interface para o retorno do intervalo de datas
   */
  export interface DateRange {
    dataInicio: string;
    dataFim: string;
  }
  
  /**
   * Retorna o intervalo de datas para filtros
   * @param periodo - Tipo de período
   * @returns Objeto com dataInicio e dataFim no formato ISO
   */
  export function getDateRange(
    periodo: 'hoje' | 'semana' | 'mes' | 'ano' | 'ultimos7dias' | 'ultimos30dias' | 'ultimos90dias'
  ): DateRange {
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date;
  
    switch (periodo) {
      case 'hoje':
        dataInicio = new Date(hoje);
        dataFim = new Date(hoje);
        break;
        
      case 'semana':
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - hoje.getDay()); // Domingo
        dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6); // Sábado
        break;
        
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
        
      case 'ano':
        dataInicio = new Date(hoje.getFullYear(), 0, 1);
        dataFim = new Date(hoje.getFullYear(), 11, 31);
        break;
        
      case 'ultimos7dias':
        dataFim = new Date(hoje);
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - 7);
        break;
        
      case 'ultimos30dias':
        dataFim = new Date(hoje);
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - 30);
        break;
        
      case 'ultimos90dias':
        dataFim = new Date(hoje);
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - 90);
        break;
        
      default:
        dataInicio = new Date(hoje);
        dataFim = new Date(hoje);
    }
  
    // Formata para ISO
    const formatToISO = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    return {
      dataInicio: formatToISO(dataInicio),
      dataFim: formatToISO(dataFim)
    };
  }
  
  /**
   * Retorna o primeiro dia do mês de uma data
   * @param dateStr - String de data no formato ISO ou objeto Date
   * @returns String de data no formato ISO
   */
  export function getFirstDayOfMonth(dateStr: string | Date): string {
    const date = typeof dateStr === 'string' ? parseLocalDate(dateStr) : new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    
    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  }
  
  /**
   * Retorna o último dia do mês de uma data
   * @param dateStr - String de data no formato ISO ou objeto Date
   * @returns String de data no formato ISO
   */
  export function getLastDayOfMonth(dateStr: string | Date): string {
    const date = typeof dateStr === 'string' ? parseLocalDate(dateStr) : new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const lastDay = new Date(year, month + 1, 0);
    const day = lastDay.getDate();
    
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  /**
   * Retorna o nome do mês em português
   * @param monthNumber - Número do mês (0-11) ou data
   * @returns Nome do mês em português
   */
  export function getMonthNamePT(monthNumber: number | string | Date): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    if (typeof monthNumber === 'number') {
      return months[monthNumber] || '';
    }
    
    const date = typeof monthNumber === 'string' ? parseLocalDate(monthNumber) : monthNumber;
    return months[date.getMonth()] || '';
  }
  
  /**
   * Retorna o dia da semana em português
   * @param dateStr - String de data no formato ISO ou objeto Date
   * @returns Nome do dia da semana em português
   */
  export function getDayOfWeekPT(dateStr: string | Date): string {
    const days = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    
    const date = typeof dateStr === 'string' ? parseLocalDate(dateStr) : dateStr;
    return days[date.getDay()] || '';
  }
  
  /**
   * Formata uma data com dia da semana
   * @param dateStr - String de data no formato ISO ou objeto Date
   * @returns String formatada com dia da semana
   */
  export function formatDateWithWeekday(dateStr: string | Date): string {
    const date = typeof dateStr === 'string' ? parseLocalDate(dateStr) : dateStr;
    const weekday = getDayOfWeekPT(date);
    const formatted = formatDateToBR(date);
    
    return `${weekday}, ${formatted}`;
  }
  
  /**
   * Exporta todas as funções como um objeto para facilitar o import
   */
  export const dateUtils = {
    parseLocalDate,
    formatDateToBR,
    formatDateTimeToBR,
    formatTimeToBR,
    getCurrentDateISO,
    getCurrentDateTimeISO,
    isToday,
    isOverdue,
    isFuture,
    getDaysUntil,
    getDaysAgo,
    getDaysBetween,
    isWithinDays,
    formatRelativeDate,
    addDays,
    addMonths,
    getDateUrgencyStatus,
    isValidDate,
    isValidDateBR,
    parseBRToISO,
    compareDates,
    getDateRange,
    getFirstDayOfMonth,
    getLastDayOfMonth,
    getMonthNamePT,
    getDayOfWeekPT,
    formatDateWithWeekday
  };
  
  /**
   * Export default para importação simplificada
   */
  export default dateUtils;