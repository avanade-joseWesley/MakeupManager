# 🔧 Como Executar a Migration no Supabase

## ⚠️ PROBLEMA ATUAL

Você está recebendo este erro:
```
new row for relation "appointments" violates check constraint "appointments_payment_status_check"
```

**Causa:** O banco de dados ainda está com o constraint antigo que aceita `partial`, mas o código agora só envia `paid` ou `pending`.

---

## 📋 PASSO A PASSO - EXECUTAR MIGRATION

### 1️⃣ Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto **MakeupManager**

### 2️⃣ Abrir SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New query**

### 3️⃣ Copiar e Colar o Script

1. Abra o arquivo: `database/001-fix-payment-status.sql`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **Cole no SQL Editor** do Supabase (Ctrl+V)

### 4️⃣ Executar o Script

1. Clique no botão **RUN** (ou pressione Ctrl+Enter)
2. Aguarde a execução
3. Verifique os resultados

### 5️⃣ Verificar Resultados Esperados

Você deve ver algo como:

```
NOTICE: === VERIFICANDO STATUS ANTES DA MIGRAÇÃO ===
NOTICE: Registros atualizados de partial para pending: X
NOTICE: Constraint antigo removido
NOTICE: Novo constraint adicionado (apenas paid e pending)
```

E as queries de verificação devem mostrar:

```
momento | payment_status | total
--------|----------------|------
ANTES   | partial        | X
ANTES   | pending        | Y
ANTES   | paid           | Z

momento | payment_status | total
--------|----------------|------
DEPOIS  | pending        | X+Y
DEPOIS  | paid           | Z
```

**✅ Sucesso:** Não deve aparecer mais `partial` no resultado DEPOIS!

---

## 🧪 Testar Após Migration

Depois de executar o script com sucesso:

1. **Volte para a aplicação** (http://localhost:3000)
2. **Acesse a Calculadora**
3. **Tente criar um novo agendamento**
4. **Confirme que NÃO dá mais erro!** ✅

---

## ❌ Se Der Erro Durante a Execução

### Erro: "constraint already exists"

**Solução:** O constraint novo já existe. Execute apenas a parte de UPDATE:

```sql
UPDATE appointments 
SET payment_status = 'pending' 
WHERE payment_status = 'partial';
```

### Erro: "permission denied"

**Solução:** Verifique se você está logado como owner do projeto no Supabase.

### Erro: "relation appointments does not exist"

**Solução:** Verifique se você está no projeto correto do Supabase.

---

## 🔄 Rollback (Reverter)

Se precisar reverter (NÃO RECOMENDADO):

1. Descomente a seção `ROLLBACK` no final do arquivo SQL
2. Execute apenas essa parte

**⚠️ ATENÇÃO:** Dados convertidos de `partial` para `pending` NÃO serão restaurados!

---

## ✅ Checklist de Validação

Após executar a migration:

- [ ] Script executado sem erros no Supabase
- [ ] Query de verificação mostra apenas `paid` e `pending`
- [ ] Não aparece mais `partial` nos resultados
- [ ] Aplicação consegue criar novos agendamentos
- [ ] Erro `violates check constraint` não acontece mais

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Copie a mensagem de erro completa
2. Tire um screenshot do Supabase SQL Editor
3. Me envie para análise

---

## 📝 Após Executar Com Sucesso

Marque este arquivo como executado:

```
✅ Migration 001-fix-payment-status.sql
   Executada em: __/__/2025
   Por: [seu nome]
   Status: SUCESSO
```

**Pronto para criar novos agendamentos! 🎉**
