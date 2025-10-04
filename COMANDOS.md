# Comandos Rápidos - MakeupManager

## 🏃 Comandos do Dia a Dia

### Desenvolvimento
```powershell
npm run dev              # Roda servidor local em http://127.0.0.1:3000/
```

### Build e Deploy
```powershell
npm run build            # Compila o projeto (gera pasta dist/)
.\deploy.ps1             # Publica no GitHub Pages
```

### Git - Salvar Progresso
```powershell
git add .
git commit -m "descrição das mudanças"
git push origin developer
```

## 🚀 Publicar Nova Versão

```powershell
# 1. Teste se compila
npm run build

# 2. Publique
.\deploy.ps1

# 3. Acesse em 1-2 minutos:
# https://avanade-josewesley.github.io/MakeupManager/
```

## 🔧 Resolver Problemas

### Servidor não inicia
```powershell
taskkill /F /IM node.exe
npm run dev
```

### Reinstalar dependências
```powershell
Remove-Item node_modules -Recurse -Force
npm install
```

### Ver logs da pipeline
```
https://github.com/avanade-josewesley/MakeupManager/actions
```
