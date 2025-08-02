export const dateUtils = {
    formatToBR: (date: string | Date): string => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('pt-BR');
    },

    formatToISO: (date: Date): string => {
        return date.toISOString().split('T')[0];
    },

    getCurrentDate: (): string => {
        return new Date().toISOString().split('T')[0];
    },

    getCurrentTime: (): string => {
        return new Date().toTimeString().slice(0, 5);
    },

    getDaysUntil: (date: string): number => {
        const today = new Date();
        const targetDate = new Date(date);
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    isToday: (date: string): boolean => {
        return date === dateUtils.getCurrentDate();
    },

    isOverdue: (date: string): boolean => {
        return dateUtils.getDaysUntil(date) < 0;
    },

    addDays: (date: string, days: number): string => {
        const dateObj = new Date(date);
        dateObj.setDate(dateObj.getDate() + days);
        return dateUtils.formatToISO(dateObj);
    }
};

// Utilitários de Texto
export const textUtils = {
    normalizeText: (text: string): string => {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    },

    capitalizeFirst: (text: string): string => {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },

    truncate: (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength - 3) + '...';
    },

    removeSpecialChars: (text: string): string => {
        return text.replace(/\D/g, '');
    },

    formatInitials: (name: string): string => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
};

// Utilitários de Validação
export const validationUtils = {
    isValidCPF: (cpf: string): boolean => {
        const cleaned = textUtils.removeSpecialChars(cpf);
        if (cleaned.length !== 11) return false;

        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cleaned)) return false;

        // Validar dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleaned.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        return remainder === parseInt(cleaned.charAt(10));
    },

    isValidEmail: (email: string): boolean => {
        const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
        return regex.test(email);
    },

    isValidPhone: (phone: string): boolean => {
        const cleaned = textUtils.removeSpecialChars(phone);
        return cleaned.length >= 10 && cleaned.length <= 11;
    },

    isValidProcess: (process: string): boolean => {
        const cleaned = textUtils.removeSpecialChars(process);
        return cleaned.length === 20;
    }
};

// Utilitários de Array
export const arrayUtils = {
    removeDuplicates: <T>(array: T[], key?: keyof T): T[] => {
        if (!key) return [...new Set(array)];
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    },

    sortBy: <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },

    groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
        return array.reduce((groups, item) => {
            const groupKey = String(item[key]);
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(item);
            return groups;
        }, {} as Record<string, T[]>);
    },

    chunk: <T>(array: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};

// Utilitários de Número
export const numberUtils = {
    formatPercentage: (value: number, total: number): string => {
        if (total === 0) return '0%';
        return `${Math.round((value / total) * 100)}%`;
    },

    formatCurrency: (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    clamp: (value: number, min: number, max: number): number => {
        return Math.min(Math.max(value, min), max);
    },

    isInRange: (value: number, min: number, max: number): boolean => {
        return value >= min && value <= max;
    }
};

// Utilitários de Debounce
export const debounce = <T extends (...args: any[]) => void>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

const utils = {
    dateUtils,
    textUtils,
    validationUtils,
    arrayUtils,
    numberUtils,
    debounce
};

export default utils;