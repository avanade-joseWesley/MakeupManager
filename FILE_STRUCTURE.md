# 📁 Estrutura de Arquivos - MakeUp Manager# 📁 Estrutura de Arquivos - MakeUp Manager



## 🎯 Visão Geral do Projeto## 🎯 **Arquivos que NUNCA mudam (fixos)**



MakeupManager é um sistema completo de gestão para maquiladoras profissionais, com gerenciamento de clientes, agendamentos, cálculo de preços, dashboard financeiro e integração WhatsApp.```

C:\GitHub\MakeupManager\

## 📂 Estrutura de Diretórios├── src/                          # 📝 Código fonte (NUNCA mexer)

│   ├── components/

```│   │   ├── LoginForm.tsx         # ✅ Login + testes WhatsApp

C:\GitHub\MakeupManager\│   │   ├── WhatsAppButton.tsx    # ✅ Opção 1 (URL)

├── 📁 src/                               # Código-fonte React/TypeScript│   │   └── WhatsAppAutoSend.tsx  # ✅ Opção 3 (Auto)

│   ├── 📁 components/                    # Componentes React│   ├── lib/

│   │   ├── AppointmentsPage.tsx          # Gestão de agendamentos (lista, filtros, lembretes)│   │   └── supabase.ts          # ✅ Configuração BD

│   │   ├── CalendarPage.tsx              # Calendário mensal interativo│   ├── index.css               # ✅ Estilos principais

│   │   ├── FinancialDashboard.tsx        # Dashboard financeiro e métricas│   └── main.tsx                # ✅ App principal

│   │   ├── Clients.tsx                   # CRUD de clientes├── index.html                  # ⚠️ DESENVOLVIMENTO (não mexer)

│   │   ├── ClientsPage.tsx               # Página wrapper de clientes├── package.json               # ✅ Dependências

│   │   ├── Dashboard.tsx                 # Dashboard principal e navegação├── .env                       # ✅ Variáveis ambiente

│   │   ├── LoginForm.tsx                 # Autenticação Supabase└── tailwind.config.cjs        # ✅ Configuração CSS

│   │   ├── PriceCalculator.tsx           # Calculadora de preços e orçamentos```

│   │   ├── Settings.tsx                  # Configurações (serviços, áreas, perfil)

│   │   ├── PDFManager.tsx                # Geração de PDFs para orçamentos## 🔄 **Arquivos que PODEM mudar (builds)**

│   │   ├── WhatsAppButton.tsx            # Integração WhatsApp (web)

│   │   ├── NumericInput.tsx              # Input formatado para valores numéricos```

│   │   ├── ErrorBoundary.tsx             # Tratamento de erros React├── dist/                      # 🚀 Build produção (auto-gerado)

│   │   └── Container.tsx                 # Container wrapper genérico│   ├── index.html            # 📦 HTML final

│   ├── 📁 lib/│   └── assets/               # 📦 JS e CSS finais

│   │   └── supabase.ts                   # Cliente Supabase + tipos TypeScript├── assets/                   # 📦 Cópia para GitHub Pages

│   ├── App.tsx                           # Componente raiz da aplicação└── node_modules/             # 📚 Dependências (auto)

│   ├── App.css                           # Estilos do App```

│   ├── main.tsx                          # Entry point (ReactDOM.render)

│   ├── index.css                         # Estilos globais + Tailwind## 🎮 **Comandos Organizados**

│   └── vite-env.d.ts                     # Tipos TypeScript para Vite

│### Desenvolvimento (localhost)

├── 📁 database/                          # Scripts SQL e migrações```bash

│   ├── migrations.sql                    # Migrações consolidadasnpm run dev                   # ✅ Roda local (NÃO mexe em arquivos)

│   ├── 001-fix-payment-status.sql        # Simplifica status de pagamento```

│   ├── 002-add-total-amount-paid.sql     # Campo total_amount_paid

│   ├── 003-add-payment-total-appointment.sql # Campo payment_total_appointment### Produção (GitHub Pages)

│   ├── 004-add-travel-fee-field.sql      # Campos travel_fee e is_custom_price```bash

│   ├── create_clients_table.sql          # Criação da tabela clientsnpm run build                 # 📦 Gera dist/

│   ├── clients_rls.sql                   # Políticas RLS para clientesnpm run deploy               # 🚀 Envia para GitHub Pages

│   └── README.md                         # Documentação do banco```

│

├── 📁 public/                            # Assets estáticos## 🔧 **Por que arquivos mudavam antes?**

│   └── manifest.json                     # Manifest PWA

│1. **Confusão:** index.html sendo sobrescrito entre dev/prod

├── 📁 scripts/                           # Scripts Node.js auxiliares2. **Deploy:** Copiando arquivos desnecessariamente

│   ├── seed_clients.cjs                  # Seed de clientes teste3. **Limpeza:** Deletando arquivos que não precisava

│   └── create-budgets-bucket.cjs         # Criação de bucket Supabase

│## ✅ **Solução: Nunca mais mexer nos arquivos fixos!**

├── 📁 .github/                           # Configurações GitHub

│   ├── 📁 workflows/- **Para testar:** Apenas `npm run dev`

│   │   └── ci-deploy.yml                 # Pipeline CI/CD (build + deploy)- **Para deploy:** Apenas `npm run deploy`

│   └── copilot-instructions.md           # Instruções para GitHub Copilot- **Código:** Apenas editar dentro de `src/`

│

├── 📁 dist/                              # ⚠️ Build de produção (auto-gerado)---

│   ├── index.html                        # HTML final otimizado

│   └── 📁 assets/                        # JS/CSS minificados## 🚀 **Próximos Passos:**

│

├── 📁 node_modules/                      # ⚠️ Dependências npm (auto-gerado)1. **Node.js 18** (sua escolha: NVM ou global)

│2. **Teste WhatsApp** (ambas opções funcionam)

├── 📄 .env                               # ⚠️ Variáveis de ambiente (LOCAL, não commitado)3. **Arquivos organizados** (nunca mais bagunça!)

├── 📄 .gitignore                         # Arquivos ignorados pelo Git

├── 📄 package.json                       # Dependências e scripts npm**Qual opção você quer para o Node.js?** 🎯
├── 📄 package-lock.json                  # Lock file das dependências
├── 📄 vite.config.ts                     # Configuração Vite (build tool)
├── 📄 tsconfig.json                      # Configuração TypeScript
├── 📄 tailwind.config.cjs                # Configuração Tailwind CSS
├── 📄 postcss.config.cjs                 # Configuração PostCSS
├── 📄 index.html                         # HTML base (DEV)
├── 📄 deploy.ps1                         # Script PowerShell de deploy manual
├── 📄 whatsapp-server.cjs                # Servidor Node.js para WhatsApp automático
├── 📄 start-whatsapp.bat                 # Inicializador do servidor WhatsApp
│
└── 📄 Documentação/
    ├── README.md                         # Documentação principal
    ├── COMANDOS.md                       # Comandos rápidos
    ├── DEPLOY_GUIDE.md                   # Guia de deploy detalhado
    ├── FILE_STRUCTURE.md                 # Este arquivo
    ├── WHATSAPP_README.md                # Documentação WhatsApp
    └── [Outros arquivos .md]             # Documentação técnica
```

## 🎯 Componentes por Funcionalidade

### 👥 Gestão de Clientes
- `Clients.tsx` - CRUD completo
- `ClientsPage.tsx` - Wrapper da página
- `WhatsAppButton.tsx` - Comunicação via WhatsApp

### 📅 Sistema de Agendamentos
- `AppointmentsPage.tsx` - Lista, filtros, status, lembretes
- `CalendarPage.tsx` - Calendário mensal, CRUD de agendamentos
- Campos: `scheduled_date`, `scheduled_time`, `status`, `services`, `notes`

### 💰 Financeiro
- `FinancialDashboard.tsx` - Métricas, receitas, pagamentos
- `PriceCalculator.tsx` - Cálculo de preços, orçamentos
- `PDFManager.tsx` - Geração de orçamentos em PDF
- Campos: `payment_total_appointment`, `total_amount_paid`, `down_payment`, `remaining_payment`

### ⚙️ Configurações
- `Settings.tsx` - Serviços, categorias, áreas, preços regionais
- Gestão de perfil do usuário

### 🔐 Autenticação
- `LoginForm.tsx` - Login via Supabase Auth
- `ErrorBoundary.tsx` - Tratamento de erros

## 🗄️ Banco de Dados (Supabase)

### Tabelas Principais
- `profiles` - Perfis de usuário
- `clients` - Clientes (RLS habilitado)
- `appointments` - Agendamentos completos
- `service_categories` - Categorias de serviços
- `services` - Serviços disponíveis
- `service_areas` - Áreas de atendimento
- `service_regional_prices` - Preços por região

### Campos Importantes de Appointments
```typescript
{
  client_id: UUID,
  scheduled_date: DATE,
  scheduled_time: TIME,
  status: 'confirmed' | 'completed' | 'cancelled',
  services: JSONB[],
  is_custom_price: BOOLEAN,
  travel_fee: DECIMAL,
  payment_total_appointment: DECIMAL,
  total_amount_paid: DECIMAL,
  down_payment: DECIMAL,
  remaining_payment: DECIMAL,
  notes: TEXT,
  address: TEXT
}
```

## 🔄 Fluxo de Desenvolvimento

### Comandos Principais

```powershell
# Desenvolvimento local
npm run dev                # Roda em http://127.0.0.1:3000/

# Build de produção
npm run build              # Gera pasta dist/

# Deploy manual
.\deploy.ps1               # Publica no GitHub Pages

# Versionamento
git add .
git commit -m "feat: descrição"
git push origin developer
```

### Arquivos que NUNCA Devem Ser Editados Manualmente
- ❌ `dist/*` - Gerado automaticamente pelo build
- ❌ `node_modules/*` - Gerenciado pelo npm
- ❌ `.env` - Nunca commitar (já está no .gitignore)

### Arquivos de Configuração (Editar com Cuidado)
- ⚠️ `vite.config.ts` - Configuração de build e base path
- ⚠️ `package.json` - Scripts e dependências
- ⚠️ `tailwind.config.cjs` - Configuração de estilos

## 🚀 Deploy

### Manual (Recomendado)
```powershell
.\deploy.ps1
```
- Faz build automático
- Publica diretamente no `gh-pages`
- Não precisa fazer merge para `master`

### Automático (CI/CD)
```powershell
git checkout master
git merge developer
git push origin master
```
- GitHub Actions roda automaticamente
- Build + Deploy via pipeline
- Acesse logs em: https://github.com/avanade-joseWesley/MakeupManager/actions

## 📝 Padrões de Código

### TypeScript
- Strict mode habilitado
- Tipos explícitos para props
- Interfaces para objetos complexos

### React
- Functional components com hooks
- useState/useEffect para state management
- Supabase para dados persistentes

### Tailwind CSS
- Classes utilitárias
- Gradientes customizados
- Responsivo mobile-first

### Supabase Queries
```typescript
// Sempre filtrar por user_id (RLS)
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('user_id', user.id)
  .order('scheduled_date', { ascending: false })
```

## 🔒 Segurança

- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Isolamento de dados por `user_id`
- ✅ `.env` no `.gitignore`
- ✅ Credenciais apenas em variáveis de ambiente

## 📚 Documentação Adicional

- **README.md** - Visão geral e setup
- **COMANDOS.md** - Comandos rápidos
- **DEPLOY_GUIDE.md** - Guia de deploy completo
- **copilot-instructions.md** - Contexto para AI assistants
- **database/README.md** - Documentação do banco

---

**💄 MakeUp Manager - Gestão profissional para maquiladoras!**
