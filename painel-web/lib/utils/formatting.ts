export function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
  }
  
  export function formatRG(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d?)$/, (match, p1, p2, p3, p4) =>
      p4 ? `${p1}.${p2}.${p3}-${p4}` : `${p1}.${p2}.${p3}`
    );
  }
  
  export function formatProcesso(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 20);
    return digits.replace(/^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/, '$1-$2.$3.$4.$5.$6');
  }
  
  export function formatContato(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length < 10) return digits;
  
    const isCelular = digits.length === 11;
    return isCelular
      ? digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
      : digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  export function unformat(value: string): string {
    return value.replace(/\D/g, '');
  }
  