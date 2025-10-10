# ✅ Correções: Campo payment_total_appointment

## 📋 Resumo das Alterações

Corrigido o **CalendarPage.tsx** para exibir o **valor total do atendimento** (incluindo taxa de deslocamento) ao invés de mostrar apenas o valor dos serviços.

---

## 🔧 Alterações Realizadas

### 1️⃣ Exibição do Valor na Timeline Diária
**Arquivo:** `src/components/CalendarPage.tsx` (linha ~444)

**Antes:**
```tsx
{appointment.payment_total_service && (
  <div className="text-xs mt-1 font-medium">
    💰 R$ {appointment.payment_total_service.toFixed(2)}
  </div>
)}
```

**Depois:**
```tsx
{appointment.payment_total_appointment && (
  <div className="text-xs mt-1 font-medium">
    💰 R$ {appointment.payment_total_appointment.toFixed(2)}
  </div>
)}
```

---

### 2️⃣ Iniciar Edição de Valores
**Arquivo:** `src/components/CalendarPage.tsx` (função `startEditingPayment`)

**Antes:**
```tsx
setEditTotalValue(appointment.payment_total_service?.toString() || '0')
```

**Depois:**
```tsx
setEditTotalValue(appointment.payment_total_appointment?.toString() || '0')
```

**Motivo:** Ao editar, deve carregar o valor total do atendimento, não apenas dos serviços.

---

### 3️⃣ Salvar Alterações
**Arquivo:** `src/components/CalendarPage.tsx` (função `savePaymentChanges`)

**Antes:**
```tsx
.update({
  payment_total_service: totalValue,
  payment_down_payment_expected: downPayment,
  ...
})
```

**Depois:**
```tsx
.update({
  payment_total_appointment: totalValue,
  payment_down_payment_expected: downPayment,
  ...
})
```

**Motivo:** Salvar no campo correto que representa o valor total do atendimento.

---

### 4️⃣ Exibição no Modal de Detalhes do Dia
**Arquivo:** `src/components/CalendarPage.tsx` (modal de detalhes)

**Antes:**
```tsx
<div className="flex items-center">
  <span className="mr-2">💰</span>
  <span className="font-bold text-green-600">
    R$ {appointment.payment_total_service.toFixed(2)}
  </span>
  ...
</div>
{appointment.payment_down_payment_expected && ...}
{appointment.payment_down_payment_paid && ...}
```

**Depois:**
```tsx
<div className="flex items-center">
  <span className="mr-2">💰</span>
  <span className="font-bold text-green-600">
    Total: R$ {(appointment.payment_total_appointment || 0).toFixed(2)}
  </span>
  ...
</div>

{/* Mostrar valor dos serviços separadamente (se diferente do total) */}
{appointment.payment_total_service && 
 appointment.payment_total_service !== appointment.payment_total_appointment && (
  <div className="flex items-center text-sm">
    <span className="mr-2">💄</span>
    <span className="text-gray-600">
      Serviços: R$ {appointment.payment_total_service.toFixed(2)}
    </span>
  </div>
)}

{/* Valor da entrada esperada */}
{appointment.payment_down_payment_expected && 
 appointment.payment_down_payment_expected > 0 && (
  <div className="flex items-center text-sm">
    <span className="mr-2">💵</span>
    <span className="text-blue-600">
      Entrada: R$ {appointment.payment_down_payment_expected.toFixed(2)}
    </span>
  </div>
)}

{/* Valor já pago */}
{appointment.total_amount_paid && appointment.total_amount_paid > 0 && (
  <div className="flex items-center text-sm">
    <span className="mr-2">✅</span>
    <span className="text-green-600">
      Pago: R$ {appointment.total_amount_paid.toFixed(2)}
    </span>
  </div>
)}

{/* Valor pendente */}
{appointment.payment_total_appointment && 
 appointment.total_amount_paid !== undefined && (
  <div className="flex items-center text-sm font-bold">
    <span className="mr-2">⏳</span>
    <span className={`${
      appointment.payment_total_appointment - appointment.total_amount_paid > 0
        ? 'text-orange-600'
        : 'text-green-600'
    }`}>
      Pendente: R$ {(appointment.payment_total_appointment - appointment.total_amount_paid).toFixed(2)}
    </span>
  </div>
)}
```

---

## 📊 Campos de Pagamento - Estrutura Completa

### payment_total_service
- **Descrição:** Valor **apenas dos serviços** selecionados
- **Exemplo:** R$ 650,00 (2x Maquiagem)
- **Quando usar:** Para saber quanto cobrar pelos serviços em si

### payment_total_appointment
- **Descrição:** Valor **total do atendimento** (serviços + taxa de deslocamento)
- **Exemplo:** R$ 680,00 (R$ 650 serviços + R$ 30 taxa)
- **Quando usar:** Para saber o valor total que o cliente deve pagar
- **⭐ ESTE é o campo principal para cálculos de pagamento!**

### total_amount_paid
- **Descrição:** Total que o cliente **já pagou** até o momento
- **Exemplo:** R$ 200,00 (pagamento parcial)
- **Quando usar:** Para controlar quanto foi recebido

### Cálculo de Valor Pendente
```typescript
const valorPendente = payment_total_appointment - total_amount_paid
// Exemplo: 680 - 200 = 480 (ainda falta receber)
```

---

## ✅ Resultado Final

Agora o **CalendarPage** exibe:

1. **💰 Total:** Valor total do atendimento (serviços + taxa)
2. **💄 Serviços:** Valor apenas dos serviços (quando diferente do total)
3. **💵 Entrada:** Valor da entrada esperada
4. **✅ Pago:** Total que já foi pago
5. **⏳ Pendente:** Quanto ainda falta receber

---

## 🧪 Como Testar

1. Crie um agendamento com **taxa de deslocamento** marcada
2. Acesse o **Calendário**
3. Verifique que o valor exibido é o **total** (serviços + taxa)
4. Clique no dia para ver detalhes
5. Verifique que mostra:
   - Total do atendimento
   - Valor dos serviços (se diferente do total)
   - Entrada esperada
   - Valor já pago
   - Valor pendente

---

## 📝 Exemplo Prático

**Agendamento criado:**
- Serviços: R$ 650,00
- Taxa de deslocamento: R$ 30,00
- **Total do atendimento: R$ 680,00**
- Entrada paga: R$ 200,00

**Exibição no Calendário:**
```
💰 Total: R$ 680,00
💄 Serviços: R$ 650,00
✅ Pago: R$ 200,00
⏳ Pendente: R$ 480,00
```

---

## 🎯 Próximos Passos

- [x] PriceCalculator: Calcular e salvar `payment_total_appointment`
- [x] AppointmentsPage: Usar `payment_total_appointment` para cálculos
- [x] CalendarPage: Exibir `payment_total_appointment` corretamente
- [ ] Fase 2: Implementar sistema de parceiros (com_parceiro, taxa_parceiro, etc.)

---

**Data:** 10 de outubro de 2025  
**Status:** ✅ Concluído
