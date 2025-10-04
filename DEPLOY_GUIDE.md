# 🚀 Guia de Desenvolvimento e Deploy - MakeupManager

## 📋 Conceitos Básicos

### O que é DEV e PROD?
- **DEV (Desenvolvimento)**: Ambiente local na sua máquina onde você desenvolve e testa
- **PROD (Produção)**: Site publicado no GitHub Pages acessível para os usuários
  - URL: https://avanade-josewesley.github.io/MakeupManager/

### Branches do Git
- **developer**: Branch de desenvolvimento (onde você trabalha)
- **master**: Branch de produção (só código testado e pronto)

---

## 🔄 Fluxo de Trabalho Recomendado

### 1. Desenvolvimento Local (DEV)
```powershell
# Sempre trabalhe na branch developer
git checkout developer

# Rode o servidor de desenvolvimento
npm run dev

# Acesse: http://127.0.0.1:3000/
```

### 2. Testando Localmente
```powershell
# Quando terminar uma feature, teste o build de produção
npm run build

# (Opcional) Visualize o build localmente
npm start
# Acesse: http://127.0.0.1:4173/MakeupManager/
```

### 3. Salvando o Trabalho
```powershell
# Adicione as mudanças
git add .

# Faça commit com mensagem descritiva
git commit -m "feat: adiciona nova funcionalidade X"

# Envie para o GitHub
git push origin developer
```

### 4. Deploy para Produção (quando estiver pronto)

**OPÇÃO A - Deploy Manual (RECOMENDADO para começar)**
```powershell
# Execute o script de deploy
.\deploy.ps1
```
✅ Isso publica direto no GitHub Pages sem passar pelo CI

**OPÇÃO B - Deploy via GitHub (Pipeline CI/CD)**
```powershell
# 1. Certifique-se que está tudo funcionando em developer
npm run build

# 2. Vá para a branch master
git checkout master

# 3. Faça merge da branch developer
git merge developer

# 4. Envie para o GitHub
git push origin master

# 5. A pipeline do GitHub Actions vai rodar automaticamente e publicar
```

---

## ⚙️ Comandos Mais Usados

### Desenvolvimento Diário
```powershell
# Rodar servidor de desenvolvimento
npm run dev

# Parar o servidor
# Pressione CTRL+C no terminal
```

### Build e Testes
```powershell
# Criar build de produção (gera pasta dist/)
npm run build

# Testar o build localmente (preview)
npm start
```

### Deploy
```powershell
# Deploy manual para GitHub Pages
.\deploy.ps1
```

### Git - Dia a Dia
```powershell
# Ver status dos arquivos modificados
git status

# Adicionar arquivos para commit
git add .

# Fazer commit
git commit -m "sua mensagem aqui"

# Enviar para GitHub
git push origin developer

# Ver histórico de commits
git log --oneline
```

---

## 🔧 Pipeline do GitHub Actions

### Como Funciona Atualmente

**Quando você faz push para `master`:**
1. ✅ **Job: Build** - Compila o projeto e verifica se não há erros
2. ✅ **Job: Deploy** - Publica automaticamente no GitHub Pages

**Quando você abre um Pull Request para `master`:**
1. ✅ **Job: Build** - Só compila para validar (NÃO publica)
2. ❌ **Job: Deploy** - NÃO executa (apenas valida o código)

### Verificando a Pipeline
- Acesse: https://github.com/avanade-josewesley/MakeupManager/actions
- Veja o status de cada build (verde = sucesso, vermelho = erro)

---

## 🛡️ Proteção de Produção

### Como NÃO Quebrar o que Está Funcionando

1. **Sempre trabalhe em `developer`**
   ```powershell
   git checkout developer
   ```

2. **Teste localmente antes de fazer merge**
   ```powershell
   npm run build
   npm start
   ```

3. **Use deploy manual primeiro**
   - Use `.\deploy.ps1` quando tiver certeza
   - Evita publicar código não testado

4. **Só faça merge para master quando tiver certeza**
   ```powershell
   # Antes de fazer merge, teste tudo em developer
   npm run build
   
   # Se tudo OK, aí sim faça merge
   git checkout master
   git merge developer
   git push origin master
   ```

---

## 📝 Quando Usar Cada Comando

### npm run dev
- ✅ Quando estiver desenvolvendo
- ✅ Para ver mudanças em tempo real
- ✅ Usa base path: `/` (raiz)

### npm run build
- ✅ Antes de fazer deploy
- ✅ Para testar se o código compila sem erros
- ✅ Gera a pasta `dist/` com os arquivos otimizados
- ✅ Usa base path: `/MakeupManager/` (GitHub Pages)

### npm start (vite preview)
- ✅ Para testar o build de produção localmente
- ✅ Simula como vai ficar no GitHub Pages
- ⚠️ Precisa rodar `npm run build` antes

### .\deploy.ps1
- ✅ Para publicar no GitHub Pages manualmente
- ✅ Quando quiser controle total sobre o que vai para produção
- ✅ Roda build automaticamente se necessário

---

## 🎯 Fluxo Recomendado para Iniciantes

### Dia a Dia (Desenvolvimento)
```powershell
# 1. Certifique-se que está em developer
git checkout developer

# 2. Rode o servidor
npm run dev

# 3. Desenvolva suas features
# ... faça as alterações no código ...

# 4. Salve o progresso
git add .
git commit -m "feat: descrição do que fez"
git push origin developer
```

### Quando Quiser Publicar em Produção
```powershell
# 1. Teste se está tudo OK
npm run build

# 2. Se tudo compilou sem erros, publique
.\deploy.ps1

# 3. Aguarde 1-2 minutos e acesse:
# https://avanade-josewesley.github.io/MakeupManager/
```

---

## 🔐 Variáveis de Ambiente

### Arquivo `.env` (Local)
- ⚠️ **NUNCA** commite este arquivo (já está no .gitignore)
- Contém suas credenciais do Supabase
- Necessário para rodar localmente

### Variáveis em Produção
- O GitHub Pages usa as mesmas variáveis que você definiu no `.env`
- ⚠️ **ATENÇÃO**: Como o código é público, suas credenciais estarão expostas
- 💡 **Recomendação**: Use Row Level Security (RLS) no Supabase para proteger os dados

---

## 📊 Estrutura de Branches Recomendada

```
developer (desenvolvimento)
    ↓
    ↓ (quando estiver pronto)
    ↓
master (produção)
    ↓
GitHub Pages (site publicado)
```

---

## ⚡ Troubleshooting

### Tela Branca no Navegador
- ✅ Verifique se o `.env` existe e está preenchido
- ✅ Rode `npm run dev` novamente
- ✅ Abra o DevTools (F12) e veja erros no Console

### Erro ao Rodar `npm run dev`
- ✅ Delete `node_modules` e rode `npm install`
- ✅ Mate processos Node: `taskkill /F /IM node.exe`

### Deploy Falhou
- ✅ Veja os logs em: https://github.com/avanade-josewesley/MakeupManager/actions
- ✅ Use `.\deploy.ps1` como alternativa (deploy manual)

### Site 404 no GitHub Pages
- ✅ Aguarde 2-3 minutos após o deploy
- ✅ Verifique se a branch `gh-pages` existe no GitHub
- ✅ Rode `.\deploy.ps1` novamente

---

## 📚 Resumo Rápido

| Ação | Comando |
|------|---------|
| Desenvolver | `npm run dev` |
| Testar build | `npm run build` |
| Preview local | `npm start` |
| Publicar em produção | `.\deploy.ps1` |
| Salvar progresso | `git add . && git commit -m "msg" && git push origin developer` |
| Ver pipeline | Acesse GitHub → Actions |

---

## 🎓 Dica Final

**Para não quebrar produção:**
1. Sempre desenvolva em `developer`
2. Teste com `npm run build` antes de publicar
3. Use `.\deploy.ps1` quando tiver certeza
4. Mantenha `master` sempre estável

**Boa prática:**
- Commit pequenos e frequentes em `developer`
- Deploy para produção apenas quando features estiverem completas
- Sempre teste localmente antes de publicar
