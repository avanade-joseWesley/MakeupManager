# 🔧 Troubleshooting: Campo payment_total_appointment não está sendo setado

## 🎯 Problema Relatado

Você executou a migration SQL com sucesso (campo foi criado no banco), mas ao criar um agendamento pela calculadora, o campo **`payment_total_appointment`** não está sendo preenchido.

---

## ✅ Verificações Já Feitas

1. ✅ Migration executada (campo existe no banco)
2. ✅ Código atualizado (INSERT inclui o campo)
3. ✅ TypeScript compilando sem erros

---

## 🔍 Debug - Como Verificar

### PASSO 1: Verificar Console do Navegador

1. Abra a aplicação no navegador
2. Pressione **F12** (DevTools)
3. Vá na aba **Console**
4. Tente criar um agendamento
5. Veja se aparecem estas mensagens:

```
💰 VALORES CALCULADOS: {
  servicesOnlyValue: 300,
  travelFee: 50,
  totalAppointmentValue: 350,
  includeTravelFee: true
}

📝 CRIANDO AGENDAMENTO COM: {
  payment_total_service: 300,
  payment_total_appointment: 350,
  total_amount_paid: 100
}
```

### PASSO 2: Verificar no Banco de Dados

Depois de criar um agendamento, execute no Supabase SQL Editor:

```sql
SELECT 
  id,
  created_at,
  payment_total_service,
  payment_total_appointment,
  total_amount_paid,
  (payment_total_appointment - payment_total_service) as taxa
FROM appointments
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado Esperado:**
```
payment_total_service: 300
payment_total_appointment: 350
total_amount_paid: 100
taxa: 50
```

---

## ❌ Possíveis Causas e Soluções

### Causa 1: Código Antigo em Cache

**Sintoma:** Console não mostra os logs que adicionamos  
**Solução:**

1. Pare o servidor (Ctrl+C no terminal)
2. Limpe o cache do navegador (Ctrl+Shift+Del)
3. Reinicie o servidor:
```bash
npm run dev
```
4. Recarregue a página com Ctrl+Shift+R (hard refresh)

### Causa 2: Supabase não Reconhece o Campo

**Sintoma:** Erro no console tipo "column does not exist"  
**Solução:**

Verifique se o campo existe:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND column_name = 'payment_total_appointment';
```

Se não aparecer nada, execute a migration novamente.

### Causa 3: Valor Sendo Setado como NULL ou 0

**Sintoma:** Campo existe mas está NULL ou 0  
**Solução:**

Verifique os valores no console. Se `totalAppointmentValue` estiver 0 ou NaN:

**Problema:** `includeTravelFee` está false OU `calculatedPrices.services` está vazio

**Verificar:**
1. Você marcou a checkbox "Incluir taxa de deslocamento"?
2. Você selecionou pelo menos 1 serviço?
3. A área selecionada tem taxa cadastrada?

### Causa 4: Migration 002 Não Foi Executada

**Sintoma:** Erro ao inserir sobre campo `total_amount_paid`  
**Solução:**

Execute a migration 002 PRIMEIRO:
```sql
-- Execute database/002-add-total-amount-paid.sql
```

Depois execute a 003:
```sql
-- Execute database/003-add-payment-total-appointment.sql
```

---

## 🧪 Teste Passo a Passo

1. **Limpe o cache** (Ctrl+Shift+Del)
2. **Reinicie o servidor** (Ctrl+C e `npm run dev`)
3. **Abra DevTools** (F12)
4. **Vá na aba Console**
5. **Crie um agendamento:**
   - Selecione um cliente
   - Selecione uma área
   - Selecione 1 serviço
   - ✅ **MARQUE** "Incluir taxa de deslocamento"
   - Preencha data/hora
   - Clique em "Confirmar Agendamento"

6. **Verifique o Console:**
   - Deve aparecer "💰 VALORES CALCULADOS"
   - Deve aparecer "📝 CRIANDO AGENDAMENTO COM"
   - Valores devem estar corretos

7. **Verifique o Banco:**
   ```sql
   SELECT * FROM appointments ORDER BY created_at DESC LIMIT 1;
   ```

---

## 📸 O Que Reportar Se Continuar Com Problema

Me envie:

1. **Screenshot do Console** mostrando os logs
2. **Screenshot do Supabase** com a query acima
3. **Responda estas perguntas:**
   - Você marcou "Incluir taxa de deslocamento"?
   - A área selecionada tem taxa cadastrada? (quanto?)
   - Qual o valor do serviço selecionado?
   - Apareceu algum erro no console?

---

## 🎯 Teste Rápido

Para testar se o problema é com a taxa de deslocamento, tente criar um agendamento **SEM** marcar a checkbox "Incluir taxa de deslocamento".

**Resultado Esperado:**
- `payment_total_service` = valor do serviço (ex: 300)
- `payment_total_appointment` = valor do serviço (ex: 300)
- Taxa = 0

Se funcionar assim, o problema pode estar na lógica da checkbox ou na taxa da área.

---

## ✅ Quando Está Funcionando Corretamente

Você verá no console:
```
💰 VALORES CALCULADOS: {
  servicesOnlyValue: 300,
  travelFee: 50,
  totalAppointmentValue: 350,
  includeTravelFee: true
}

📝 CRIANDO AGENDAMENTO COM: {
  payment_total_service: 300,
  payment_total_appointment: 350,
  total_amount_paid: 100
}
```

E no banco:
```sql
payment_total_service    = 300.00
payment_total_appointment = 350.00
total_amount_paid        = 100.00
```

**Me avise o que aparece no console! 🔍**
