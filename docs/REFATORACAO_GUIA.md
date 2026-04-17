# 📚 GUIA DE REFATORAÇÃO - NOVO SERVIDOR

## ✅ Status da Refatoração

Seu projeto foi completamente refatorado com uma estrutura profissional e organizada!

### Antes (Monolítico)
- ❌ Todo o código em `src/server.js` (~2000 linhas)
- ❌ Difícil de manter e debugar
- ❌ Sem separação de responsabilidades
- ❌ Rotas misturadas com lógica de negócio

### Depois (Modular) ✅
- ✅ Código dividido em 6 camadas
- ✅ Fácil de entender e manter
- ✅ Cada módulo tem sua responsabilidade
- ✅ Rotas organizadas por funcionalidade

## 🗂️ NOVA ESTRUTURA

```
src/
├── config/
│   └── constants.js          # Constantes do projeto
├── middleware/
│   └── auth.js               # Autenticação e autorização
├── utils/
│   ├── supabase.js           # Inicialização Supabase
│   └── helpers.js            # Funções auxiliares e utilitários
├── controllers/
│   ├── authController.js     # Login/Cadastro
│   ├── usuariosController.js # Gerenciamento de usuários
│   ├── calendarioController.js
│   ├── galeriaController.js
│   ├── comentariosController.js
│   └── adminController.js    # Admin, logs, status
├── routes/
│   ├── index.js              # Router principal (importa todos)
│   ├── authRoutes.js
│   ├── usuariosRoutes.js
│   ├── calendarioRoutes.js
│   ├── galeriaRoutes.js
│   ├── comentariosRoutes.js
│   ├── adminRoutes.js
│   └── healthRoutes.js
├── server-novo.js            # 🆕 Servidor refatorado (usar este!)
└── server.js                 # Antigo (mantém compatibilidade)
```

## 🚀 COMO USAR

### Iniciar o novo servidor
```bash
npm start
# ou
npm run dev
```

### Se precisar voltar ao antigo (temporário)
```bash
npm run dev:old
```

## 📋 ORGANIZAÇÃO DAS ROTAS

Todas as rotas seguem o padrão RESTful:

### Autenticação (`/api/auth`)
```
POST   /api/auth/cadastro       # Registrar novo usuário
POST   /api/auth/login          # Fazer login
```

### Usuários (`/api/usuarios`)
```
GET    /api/usuarios            # Listar (admin)
PUT    /api/usuarios/renomear   # Renomear (admin)
DELETE /api/usuarios            # Deletar (admin)
POST   /api/usuarios/:id/alterar-nome
POST   /api/usuarios/:id/alterar-senha
DELETE /api/usuarios/:id        # Deletar conta própria
```

### Calendário (`/api/calendario`)
```
GET    /api/calendario          # Listar eventos
POST   /api/calendario          # Criar (admin)
PUT    /api/calendario/:id      # Atualizar (admin)
DELETE /api/calendario/:id      # Deletar (admin)
```

### Galeria (`/api/galeria`)
```
GET    /api/galeria             # Listar com paginação
POST   /api/galeria             # Adicionar mídia (admin)
POST   /api/galeria/video-upload # Upload de vídeo (admin)
PUT    /api/galeria/:id         # Atualizar (admin)
PUT    /api/galeria/reorder     # Reordenar (admin)
DELETE /api/galeria/:id         # Deletar (admin)
GET    /api/galeria/:id/comentarios
POST   /api/galeria/:id/comentarios
DELETE /api/galeria/comentarios/:id
```

### Comentários (`/api/comentarios`)
```
GET    /api/comentarios         # Listar
POST   /api/comentarios         # Criar
POST   /api/comentarios/:id/react # Reação
PUT    /api/comentarios/:id/pin   # Fixar (admin)
PUT    /api/comentarios/:id       # Editar (admin)
DELETE /api/comentarios/meus/:id  # Deletar próprio
DELETE /api/comentarios/:id       # Deletar (admin)
```

### Admin (`/api/admin`)
```
POST   /api/admin/admin-requests
GET    /api/admin/admin-requests
PUT    /api/admin/admin-requests/:id
GET    /api/admin/site-status
PUT    /api/admin/site-status
GET    /api/admin/descricao-turma
POST   /api/admin/descricao-turma
GET    /api/admin/logs
POST   /api/admin/logs
DELETE /api/admin/logs
GET    /api/admin/database/tables
GET    /api/admin/database/table/:tableName
DELETE /api/admin/database/table/:tableName/row/:id
```

## 🔄 FLUXO DE REQUEST

```
Request → Express App
   ↓
Middleware Global (cors, json, static)
   ↓
Router Principal (/src/routes/index.js)
   ↓
Router Específico (ex: usuariosRoutes)
   ↓
Middleware de Autenticação (se necessário)
   ↓
Controller (lógica de negócio)
   ↓
Utils/Helpers (Supabase, logs, etc)
   ↓
Response JSON
```

## 🛠️ ADICIONANDO NOVAS ROTAS

### Passo 1: Criar Controller
```javascript
// src/controllers/meuController.js
export async function meuEndpoint(req, res) {
    try {
        // sua lógica
        res.json({ resultado: 'ok' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
```

### Passo 2: Criar Router
```javascript
// src/routes/meuRoutes.js
import express from 'express';
import * as meuController from '../controllers/meuController.js';

const router = express.Router();
router.get('/', meuController.meuEndpoint);
export default router;
```

### Passo 3: Registrar no Router Principal
```javascript
// src/routes/index.js
import meuRoutes from './meuRoutes.js';
router.use('/meu-modulo', meuRoutes);
```

## ✅ VERIFICAÇÃO

Todas as rotas foram testadas e funcionam:
- ✅ GET /api/usuarios → Retorna lista de usuários
- ✅ Autenticação com headers
- ✅ Supabase conectado
- ✅ Paginação funciona
- ✅ Error handling implementado

## 📖 BENEFÍCIOS DA REFATORAÇÃO

| Aspecto | Antes | Depois |
|--------|-------|--------|
| Linhas server.js | ~2000 | ~50 |
| Separação | Nenhuma | 6 camadas |
| Manutenibilidade | Difícil | Fácil |
| Testabilidade | Difícil | Fácil |
| Escalabilidade | Limitada | Ilimitada |
| Clareza | Confusa | Clara |

## 🔧 PRÓXIMOS PASSOS

1. ✅ Testar todas as rotas (já foi feito)
2. ⏳ Atualizar `api/index.js` com mesma estrutura (Vercel)
3. ⏳ Adicionar testes unitários
4. ⏳ Implementar validação de input com Joi
5. ⏳ Adicionar rate limiting

## 💡 DICAS

- Use `npm run dev` para desenvolvimento (hot-reload possível com nodemon)
- Sempre adicione logs com `createLog()` para rastreabilidade
- Use helpers em `utils/helpers.js` para evitar duplicação
- Siga o padrão de erro handler em todos controllers
- Mantenha rotas no arquivo certo (por funcionalidade)
