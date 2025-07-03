
export const loginFicticio = async (email: string, senha: string): Promise<{ success: boolean; message?: string }> => {
    if (!email || !senha) {
      return { success: false, message: 'Preencha todos os campos.' };
    }
  
    if (email === 'email@gmail.com' && senha === '123') {
      document.cookie = `token=fake-token; path=/;`;
      return { success: true };
    }
  
    return { success: false, message: 'Usuário ou senha inválidos.' };
  };
  