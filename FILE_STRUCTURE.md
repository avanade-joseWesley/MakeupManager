# 📁 Estrutura de Arquivos - MakeUp Manager

## 🎯 **Arquivos que NUNCA mudam (fixos)**

```
C:\GitHub\MakeupManager\
├── src/                          # 📝 Código fonte (NUNCA mexer)
│   ├── components/
│   │   ├── LoginForm.tsx         # ✅ Login + testes WhatsApp
│   │   ├── WhatsAppButton.tsx    # ✅ Opção 1 (URL)
│   │   └── WhatsAppAutoSend.tsx  # ✅ Opção 3 (Auto)
│   ├── lib/
│   │   └── supabase.ts          # ✅ Configuração BD
│   ├── index.css               # ✅ Estilos principais
│   └── main.tsx                # ✅ App principal
├── index.html                  # ⚠️ DESENVOLVIMENTO (não mexer)
├── package.json               # ✅ Dependências
├── .env                       # ✅ Variáveis ambiente
└── tailwind.config.cjs        # ✅ Configuração CSS
```

## 🔄 **Arquivos que PODEM mudar (builds)**

```
├── dist/                      # 🚀 Build produção (auto-gerado)
│   ├── index.html            # 📦 HTML final
│   └── assets/               # 📦 JS e CSS finais
├── assets/                   # 📦 Cópia para GitHub Pages
└── node_modules/             # 📚 Dependências (auto)
```

## 🎮 **Comandos Organizados**

### Desenvolvimento (localhost)
```bash
npm run dev                   # ✅ Roda local (NÃO mexe em arquivos)
```

### Produção (GitHub Pages)
```bash
npm run build                 # 📦 Gera dist/
npm run deploy               # 🚀 Envia para GitHub Pages
```

## 🔧 **Por que arquivos mudavam antes?**

1. **Confusão:** index.html sendo sobrescrito entre dev/prod
2. **Deploy:** Copiando arquivos desnecessariamente
3. **Limpeza:** Deletando arquivos que não precisava

## ✅ **Solução: Nunca mais mexer nos arquivos fixos!**

- **Para testar:** Apenas `npm run dev`
- **Para deploy:** Apenas `npm run deploy`
- **Código:** Apenas editar dentro de `src/`

---

## 🚀 **Próximos Passos:**

1. **Node.js 18** (sua escolha: NVM ou global)
2. **Teste WhatsApp** (ambas opções funcionam)
3. **Arquivos organizados** (nunca mais bagunça!)

**Qual opção você quer para o Node.js?** 🎯