# 🗄️ Configuração do Banco de Dados

## Instruções para Supabase

### 1. Acesse o Supabase Dashboard
- Vá para [supabase.com](https://supabase.com)
- Faça login na sua conta
- Acesse seu projeto MakeupManager

### 2. Execute as Migrações
1. No dashboard do Supabase, vá para **SQL Editor** (ícone de banco de dados na sidebar)
2. Clique em **"New Query"**
3. Copie todo o conteúdo do arquivo `migrations.sql`
4. Cole no editor SQL
5. Clique em **"Run"** para executar

### 3. Verifique as Tabelas
Após executar, você deve ver as seguintes tabelas criadas:
- `profiles` - Perfis dos usuários
- `service_areas` - Regiões de atendimento
- `service_categories` - Categorias de serviços
- `services` - Serviços oferecidos

### 4. Configuração das Políticas RLS
As políticas de segurança (Row Level Security) já foram configuradas automaticamente para garantir que:
- Cada usuário só vê e modifica seus próprios dados
- Não há vazamento de informações entre usuários
- Segurança total dos dados

## Estrutura das Tabelas

### `profiles`
- Informações pessoais do usuário
- Nome, telefone, bio, endereço, Instagram
- Anos de experiência

### `service_areas`
- Regiões onde a maquiadora atende
- Nome da região, descrição, taxa de deslocamento

### `service_categories`
- Categorias de serviços (Noivas, Social, Artística, etc.)
- Nome e descrição da categoria

### `services`
- Serviços específicos dentro de cada categoria
- Nome, descrição, preço, duração
- Vinculado a uma categoria

## Próximos Passos
Após executar as migrações, a tela de Configurações estará totalmente funcional!