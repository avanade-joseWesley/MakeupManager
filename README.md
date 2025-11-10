# MakeUp Manager 💄

Sistema completo de gestão para maquiladoras profissionais.

## 🌐 Demo Online

**Acesse:** https://avanade-josewesley.github.io/MakeupManager/

## 🚀 Funcionalidades Atuais

### 👥 Gestão de Clientes
- ✅ CRUD completo de clientes
- ✅ Busca e filtros avançados
- ✅ Integração WhatsApp
- ✅ Histórico de atendimentos

### 📅 Sistema de Agendamentos
- ✅ Calendário mensal interativo
- ✅ Criação e edição de agendamentos
- ✅ Gestão de status (confirmado, completo, cancelado)
- ✅ Destaque visual para agendamentos próximos (7 dias)
- ✅ Lembretes automáticos via WhatsApp
- ✅ Controle de pagamentos (entrada, restante, total pago)

### 💰 Calculadora de Preços
- ✅ Cálculo automático por serviços
- ✅ Preços customizados
- ✅ Taxas de deslocamento por região
- ✅ Geração de orçamentos em PDF
- ✅ Envio direto via WhatsApp

### 📊 Dashboard Financeiro
- ✅ Análise de receitas e despesas
- ✅ Acompanhamento de pagamentos
- ✅ Métricas de desempenho
- ✅ Filtros por período

### ⚙️ Configurações
- ✅ Gestão de Serviços e Categorias
- ✅ Preços Regionais com taxas de deslocamento
- ✅ Perfil do usuário
- ✅ Configurações de negócio

### 🔐 Segurança & Infraestrutura
- ✅ Integração com Supabase
- ✅ Autenticação de Usuários
- ✅ Row Level Security (RLS)
- ✅ PWA Ready

## 🏗️ Setup Local

### Pré-requisitos
- Node.js 14+ (recomendado 18+)
- npm
- Git
- Conta no Supabase (grátis)

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/avanade-joseWesley/MakeupManager.git
cd MakeupManager

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env na raiz do projeto
# Copie o conteúdo de .env.example e preencha com suas credenciais do Supabase

# 4. Execute em desenvolvimento
npm run dev

# Acesse: http://127.0.0.1:3000/
```

### Configuração do Supabase

1. Crie uma conta em https://supabase.com
2. Crie um novo projeto
3. Vá em Settings → API
4. Copie a URL do projeto e a chave pública (anon key)
5. Cole no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

6. Execute os scripts SQL na pasta `database/`:
   - `create_clients_table.sql` — cria tabela de clientes
   - `clients_rls.sql` — habilita segurança RLS

## 📝 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento (http://127.0.0.1:3000/)
npm run build    # Build para produção (gera pasta dist/)
npm start        # Preview do build (http://127.0.0.1:4173/MakeupManager/)
```

### Deploy Manual

```powershell
.\deploy.ps1     # Publica no GitHub Pages
```

## 📁 Estrutura do Projeto

```
MakeupManager/
├── src/
│   ├── components/              # Componentes React
│   │   ├── AppointmentsPage.tsx # Gestão de agendamentos
│   │   ├── CalendarPage.tsx     # Calendário mensal
│   │   ├── FinancialDashboard.tsx # Dashboard financeiro
│   │   ├── Clients.tsx          # Gestão de clientes
│   │   ├── ClientsPage.tsx      # Página de clientes
│   │   ├── Dashboard.tsx        # Dashboard principal
│   │   ├── LoginForm.tsx        # Login/Autenticação
│   │   ├── PriceCalculator.tsx  # Calculadora de preços
│   │   ├── Settings.tsx         # Configurações
│   │   ├── PDFManager.tsx       # Geração de PDFs
│   │   ├── WhatsAppButton.tsx   # Integração WhatsApp
│   │   ├── NumericInput.tsx     # Input numérico formatado
│   │   ├── ErrorBoundary.tsx    # Tratamento de erros
│   │   └── Container.tsx        # Container wrapper
│   ├── lib/
│   │   └── supabase.ts          # Cliente Supabase + tipos
│   ├── App.tsx                  # App principal
│   └── main.tsx                 # Entry point
├── database/                    # Scripts SQL e migrações
│   ├── migrations.sql           # Migrações principais
│   ├── 001-fix-payment-status.sql
│   ├── 002-add-total-amount-paid.sql
│   ├── 003-add-payment-total-appointment.sql
│   ├── 004-add-travel-fee-field.sql
│   ├── create_clients_table.sql
│   └── clients_rls.sql
├── public/                      # Assets estáticos
├── .env                         # Variáveis de ambiente (local)
├── deploy.ps1                   # Script de deploy
└── vite.config.ts               # Configuração Vite
```

## 🔄 Fluxo de Deploy

### Desenvolvimento → Produção

```
developer (branch de desenvolvimento)
    ↓ trabalho diário
    ↓ commits frequentes
    ↓
    ↓ quando estiver pronto
    ↓
master (branch de produção)
    ↓ merge + push
    ↓
GitHub Actions (CI/CD)
    ↓ build automático
    ↓
GitHub Pages (produção)
https://avanade-josewesley.github.io/MakeupManager/
```

### Opção 1: Deploy Manual (Recomendado)
```powershell
# Teste localmente
npm run build

# Publique quando estiver pronto
.\deploy.ps1
```

### Opção 2: Deploy via GitHub Actions
```bash
# 1. Merge developer → master
git checkout master
git merge developer
git push origin master

# 2. GitHub Actions faz deploy automático
# 3. Aguarde 1-2 minutos
```

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite 4
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Deploy:** GitHub Pages
- **CI/CD:** GitHub Actions

## 📚 Documentação Adicional

- 📖 [Guia Completo de Deploy](DEPLOY_GUIDE.md) - Tutorial detalhado
- ⚡ [Comandos Rápidos](COMANDOS.md) - Referência rápida
- 🔐 [Segurança RLS](database/clients_rls.sql) - Políticas de acesso

## 🔐 Segurança

- ✅ Row Level Security (RLS) habilitado
- ✅ Usuários só acessam seus próprios dados
- ✅ Autenticação via Supabase Auth
- ⚠️ Nunca commite o arquivo `.env` (já está no .gitignore)

## 🤝 Contribuição

### Fluxo de Trabalho

1. Trabalhe sempre na branch `developer`
2. Faça commits pequenos e descritivos
3. Teste localmente antes de fazer merge
4. Só faça merge para `master` quando estiver pronto para produção

```bash
# Exemplo de commit
git add .
git commit -m "feat: adiciona filtro de busca de clientes"
git push origin developer
```

## � Pipeline CI/CD

A pipeline do GitHub Actions roda automaticamente:

- **Em Pull Requests para master:** Apenas valida o build
- **Em Push para master:** Valida build + faz deploy automático

Ver status: https://github.com/avanade-josewesley/MakeupManager/actions

## � Troubleshooting

### Tela branca no navegador
- Verifique se o `.env` existe e está preenchido
- Reinicie o servidor: `npm run dev`

### Erro ao buildar
- Delete `node_modules`: `Remove-Item node_modules -Recurse -Force`
- Reinstale: `npm install`

### Deploy falhou
- Veja logs em: https://github.com/avanade-josewesley/MakeupManager/actions
- Use deploy manual: `.\deploy.ps1`

## 📞 Contato

- **Desenvolvedor:** Jose Wesley
- **GitHub:** [@avanade-joseWesley](https://github.com/avanade-joseWesley)
- **Projeto:** MakeUp Manager

---

**💄 Transformando a gestão de maquiladoras profissionais!**