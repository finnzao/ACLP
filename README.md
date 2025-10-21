# Sistema de Controle de Comparecimento (SCC)

## Visão Geral

O Sistema de Controle de Comparecimento (SCC) é uma aplicação web desenvolvida para o Tribunal de Justiça da Bahia (TJBA) com o objetivo de gerenciar e monitorar o comparecimento de pessoas em liberdade provisória. O sistema oferece recursos completos para cadastro, acompanhamento e controle de custodiados, garantindo conformidade com as determinações judiciais.

## Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Linguagem de programação tipada
- **Tailwind CSS** - Framework CSS utilitário
- **React Hook Form** - Gerenciamento de formulários
- **Recharts** - Biblioteca de gráficos
- **Lucide Icons** - Biblioteca de ícones
- **XLSX** - Exportação de dados para Excel

### Backend (Integração)
- **API REST** - Comunicação via HTTP
- **JWT** - Autenticação e autorização
- **Spring Boot** - Framework Java (backend separado)

## Principais Funcionalidades

### Autenticação e Autorização

O sistema implementa um robusto mecanismo de autenticação baseado em JWT (JSON Web Tokens) com dois níveis distintos de acesso. Administradores possuem controle total sobre todas as funcionalidades, incluindo cadastro de novos usuários e configurações do sistema. Usuários regulares têm acesso às funcionalidades operacionais, como registro de comparecimentos e visualização de dados. O sistema mantém a sessão ativa através de refresh tokens automáticos, garantindo que o usuário não precise realizar login repetidamente durante o uso normal.

### Gestão de Custodiados

Este módulo permite o cadastro completo de pessoas em liberdade provisória, incluindo todos os dados pessoais, processuais e de contato necessários para o acompanhamento judicial. O sistema valida automaticamente documentos como CPF e RG, garantindo a integridade dos dados. Cada custodiado tem um perfil completo que inclui informações do processo judicial, vara responsável, comarca, data da decisão judicial e periodicidade de comparecimento estabelecida. O endereço residencial é registrado com validação de CEP e pode ser atualizado a cada comparecimento, mantendo um histórico completo de mudanças.

### Controle de Comparecimentos

O registro de comparecimentos é o núcleo operacional do sistema. Quando um custodiado comparece, o servidor registra a presença através de uma busca rápida por nome, CPF ou número do processo. O sistema diferencia entre comparecimentos presenciais e online (balcão virtual), registrando data, hora e o servidor responsável pela validação. Durante o atendimento, é obrigatório perguntar sobre mudança de endereço, e caso tenha ocorrido, o novo endereço é registrado com o motivo da mudança. O sistema calcula automaticamente a data do próximo comparecimento baseado na periodicidade estabelecida e atualiza o status de conformidade do custodiado.

### Dashboard Analítico

O dashboard oferece uma visão completa e em tempo real da situação de todos os custodiados. Apresenta estatísticas detalhadas incluindo total de pessoas cadastradas, percentual de conformidade, quantidade de inadimplentes e comparecimentos agendados para o dia. Alertas visuais destacam situações urgentes, como pessoas em atraso ou com comparecimento marcado para hoje. Gráficos interativos mostram tendências de conformidade ao longo do tempo, distribuição de status e comparecimentos por dia da semana, permitindo aos gestores identificar padrões e tomar decisões baseadas em dados.

### Sistema de Alertas e Urgências

O sistema monitora continuamente as datas de comparecimento e gera alertas automáticos para situações que requerem atenção. Custodiados com comparecimento em atraso são destacados em vermelho em todas as telas. Comparecimentos agendados para o dia atual aparecem com destaque amarelo. O sistema também identifica pessoas com comparecimento nos próximos 7 dias, permitindo planejamento antecipado. Todos esses indicadores visuais garantem que nenhum prazo seja perdido e que situações críticas recebam atenção imediata.

### Histórico e Rastreabilidade

Cada ação no sistema é registrada, criando um histórico completo e auditável. O módulo de histórico permite visualizar todos os comparecimentos anteriores de um custodiado, incluindo datas, horários, tipo de validação e observações registradas. O histórico de endereços mostra todas as mudanças residenciais, com datas, motivos e o servidor que registrou a alteração. Essa rastreabilidade completa é essencial para questões judiciais e administrativas.

### Busca e Filtros Avançados

O sistema oferece múltiplas formas de localizar informações rapidamente. A busca global permite encontrar custodiados por nome, CPF, RG ou número do processo. Filtros avançados permitem segmentar por status (conformidade/inadimplência), urgência (hoje/atrasados/próximos 7 dias), período de datas, vara, comarca e periodicidade. Todos os filtros podem ser combinados para análises específicas, e os resultados podem ser ordenados por qualquer coluna.

### Exportação e Relatórios

Toda informação visualizada pode ser exportada para Excel, mantendo formatação e incluindo estatísticas calculadas. O sistema gera relatórios detalhados com informações dos filtros aplicados, data de geração e estatísticas resumidas. A exportação preserva todos os dados relevantes, incluindo endereços completos, histórico de comparecimentos e observações, facilitando análises externas ou arquivamento.

## Interface Responsiva

O sistema adapta-se automaticamente ao dispositivo utilizado. Na versão desktop, apresenta interface completa com tabelas detalhadas, múltiplas colunas e visualização simultânea de várias informações. Na versão mobile, reorganiza o conteúdo em cards compactos, utiliza navegação por abas, implementa menus retráteis e otimiza o espaço vertical. Todos os elementos são otimizados para toque, com áreas de clique adequadas e gestos intuitivos.

## Segurança

### Medidas Implementadas

O sistema implementa múltiplas camadas de segurança. A autenticação JWT garante que apenas usuários autorizados acessem o sistema. Tokens expiram após período determinado e são renovados automaticamente. Todas as senhas seguem critérios rigorosos de complexidade (mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais). Inputs são validados e sanitizados tanto no frontend quanto no backend, prevenindo injeções e ataques XSS. O sistema registra todas as ações em logs de auditoria, permitindo rastreamento completo de quem fez o quê e quando.

### Controle de Acesso

Administradores têm acesso completo, podendo cadastrar e editar custodiados, criar novos usuários através do sistema de convites, acessar todos os relatórios e estatísticas, configurar parâmetros do sistema e visualizar logs de auditoria. Usuários regulares podem registrar comparecimentos, visualizar dados de custodiados, gerar relatórios básicos de suas atividades e atualizar informações durante atendimentos. Esse controle granular garante que cada pessoa tenha acesso apenas às funcionalidades necessárias para seu trabalho.

## Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- NPM ou Yarn
- Servidor backend configurado

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/scc-frontend.git
cd scc-frontend
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Edite o arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

5. Execute o projeto:
```bash
npm run dev
# ou
yarn dev
```

O sistema estará disponível em `http://localhost:3000`

## Módulos do Sistema

### Dashboard Principal

Apresenta visão executiva com cards de estatísticas mostrando total de custodiados, taxa de conformidade, quantidade de inadimplentes e alertas urgentes. Gráfico de pizza visualiza distribuição entre conformes e inadimplentes. Gráfico de barras mostra comparecimentos por dia da semana. Gráfico de linha apresenta tendência de conformidade nos últimos 6 meses. Lista de próximos comparecimentos permite acesso rápido aos casos do dia. Seção de ações rápidas oferece atalhos para funções mais utilizadas.

### Cadastro de Custodiados

Formulário completo dividido em seções lógicas. Dados pessoais incluem nome completo, CPF, RG e telefone de contato. Dados processuais registram número do processo (formato CNJ), vara responsável, comarca e data da decisão judicial. Configuração de periodicidade permite escolher entre opções padrão (semanal, quinzenal, mensal, bimensal, trimestral) ou definir período customizado. Endereço residencial com busca automática por CEP e validação de todos os campos. Campo de observações permite registrar informações adicionais relevantes.

### Registro de Comparecimento

Interface otimizada para agilidade no atendimento. Busca rápida localiza custodiado por nome, CPF ou processo. Exibe informações completas incluindo status atual e histórico. Pergunta obrigatória sobre mudança de endereço com formulário condicional se houver alteração. Seleção do tipo de atendimento (presencial ou online). Registro de data e hora com valores padrão do momento atual. Campo para observações sobre o atendimento. Confirmação mostra próxima data calculada automaticamente.

### Lista Geral

Tabela completa com todos os custodiados cadastrados. Colunas incluem dados pessoais, informações processuais, status de conformidade e datas relevantes. Indicadores visuais destacam urgências com cores (vermelho para atrasos, amarelo para hoje, azul para próximos 7 dias). Sistema de paginação para grandes volumes de dados. Ordenação por qualquer coluna em ordem crescente ou decrescente. Filtros rápidos por status e urgência. Busca integrada filtra resultados em tempo real. Botão de exportação gera Excel com dados filtrados.

### Histórico de Comparecimentos

Visualização cronológica de todos os comparecimentos registrados. Cada registro mostra custodiado, data e hora, tipo de validação, servidor responsável e observações. Filtros por período permitem análise temporal. Busca por nome ou validador localiza registros específicos. Indicadores mostram se houve mudança de endereço no atendimento. Link direto para histórico de endereços quando aplicável.

### Configurações e Administração

Gestão de perfil permite atualizar dados pessoais e senha. Sistema de convites para novos usuários com dois métodos: envio por email com dados pré-configurados ou geração de link genérico para compartilhamento. Lista de convites mostra status (pendente/ativado/expirado). Logs de auditoria registram todas as ações do sistema. Configurações gerais permitem personalizar comportamento do sistema.

## Integração com Backend

### Comunicação API

O sistema utiliza cliente HTTP customizado com interceptadores para autenticação automática. Todas as requisições incluem token JWT no header. Sistema de retry automático para falhas de rede. Tratamento padronizado de erros com mensagens amigáveis ao usuário. Cache de requisições para otimizar performance. Indicador visual mostra status da conexão com servidor.

### Sincronização de Dados

Dados são atualizados em tempo real após cada operação. Sistema de polling opcional para atualizações automáticas. Validação dupla (frontend e backend) garante integridade. Mensagens de confirmação informam sucesso ou falha de operações. Em caso de erro, sistema mantém dados locais e permite retry.

## Build e Deploy

### Build de Produção
```bash
npm run build
npm run start
```

### Deploy com Docker
```bash
docker build -t scc-frontend .
docker run -p 3000:3000 scc-frontend
```

## Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```
---

**Versão:** 2.0.0  
**Última Atualização:** 2025  
**Status:** Em Produção