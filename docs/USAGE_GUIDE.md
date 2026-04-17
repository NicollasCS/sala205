# 📖 Guia de Uso - Arquitetura Modular

## 🚀 Como Executar

### Desenvolvimento
```bash
npm run dev
# Servidor rodando em http://localhost:6767
```

### Testes de Endpoints
```bash
# Health check
curl http://localhost:6767/api/health

# Ver rotas disponíveis
curl http://localhost:6767/api/debug/routes
```

## 📁 Como Adicionar Novas Features

### Passo 1: Criar um novo controller
```bash
# Exemplo: Feature de notificações
touch api/controllers/notificacoesController.js
```

### Passo 2: Implementar o handler
```javascript
// api/controllers/notificacoesController.js
function handleGetNotificacoes(supabase) {
    return async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('notificacoes')
                .select('*')
                .order('data', { ascending: false });
            
            if (error) throw error;
            res.json(data || []);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar notificações' });
        }
    };
}

export { handleGetNotificacoes };
```

### Passo 3: Importar e registrar em index.js
```javascript
// No topo
import { handleGetNotificacoes } from './controllers/notificacoesController.js';

// Registrar rota
app.get('/api/notificacoes', handleGetNotificacoes(supabase));
```

## 🔧 Padrões de Desenvolvimento

### Handlers Sempre Retornam Funções

```javascript
// ✅ CORRETO
function handleFeature(supabase) {
    return async (req, res) => {
        // Lógica aqui
    };
}

// ❌ ERRADO
async function handleFeature(supabase) {
    return async (req, res) => {
        // Nunca fazer função async!
    };
}
```

### Usar Helpers para Validação

```javascript
// ✅ Use helpers existentes
import { isProfane, isAdminToken } from '../utils/helpers.js';

if (isProfane(texto)) {
    return res.status(400).json({ error: 'Contém palavrões' });
}

if (!isAdminToken(req)) {
    return res.status(403).json({ error: 'Acesso negado' });
}
```

### Usar Database Utils para Operações Comuns

```javascript
// ✅ Use database utils
import { getAppSetting, setAppSetting } from '../utils/database.js';

const config = await getAppSetting(supabase, 'minha_config');
await setAppSetting(supabase, 'minha_config', 'novo_valor');
```

## 🎯 Estrutura de Resposta

### Sucesso
```json
{
    "message": "Descrição do sucesso",
    "data": { /* dados */ }
}
```

### Erro
```json
{
    "error": "Descrição do erro",
    "details": "Detalhes opcionais"
}
```

## 🔐 Autenticação

### Headers Esperados
```
x-admin-token: turma205-admin          # Root admin
x-admin-token: turma205-dev            # Dev
x-requester-name: nome_do_usuario      # Para filtros
```

### Verificação em Handlers
```javascript
import { isAdminToken } from '../utils/helpers.js';

function handleFeature(supabase) {
    return async (req, res) => {
        if (!isAdminToken(req)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        // Lógica protegida...
    };
}
```

## 📦 Dependências de um Handler

```javascript
// Tipo: Só Supabase
function handleGetData(supabase) {
    return async (req, res) => { ... };
}

// Tipo: Supabase + Logging
function handleCreateData(supabase, createLog) {
    return async (req, res) => { ... };
}

// Tipo: Supabase + Utils
function handleGetConfig(supabase, getAppSetting) {
    return async (req, res) => { ... };
}
```

## 🧪 Estrutura de Testes

Para testar um handler isoladamente:

```javascript
// test/controllers/authController.test.js
import { handleCadastro } from '../../api/controllers/authController.js';

describe('authController', () => {
    test('handleCadastro com dados válidos', async () => {
        const mockSupabase = { /* mock */ };
        const mockCreateLog = jest.fn();
        
        const handler = handleCadastro(mockSupabase, mockCreateLog);
        
        const req = { body: { nome: 'usuario', senha: '123456' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        
        await handler(req, res);
        
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
```

## 📝 Adicionando Documentação

### JSDoc para Handlers
```javascript
/**
 * GET /api/usuarios - Listar usuários
 * @param {SupabaseClient} supabase - Cliente Supabase
 * @returns {Function} Handler Express
 * 
 * Headers:
 * - x-admin-token: Token de autenticação admin
 * 
 * Response (200):
 * {
 *   "id": "uuid",
 *   "nome": "string",
 *   "role": "admin|user",
 *   "created": "timestamp"
 * }
 */
function handleGetUsuarios(supabase) {
    return async (req, res) => { ... };
}
```

## 🚨 Debugging

### Verificar Carregamento de Controllers
```bash
# Ver se há erros de import
node api/index.js

# Em caso de erro de sintaxe, o node vai mostrar o arquivo e linha
```

### Logs Estruturados
```javascript
// ✅ Bom: Debug específico
console.log(`📥 Buscando usuário ID: ${userId}`);
console.log(`✅ ${count} usuários encontrados`);

// ❌ Evitar: Logs genéricos
console.log('fetching');
```

## 🔄 Fluxo de uma Requisição

```
1. POST /api/cadastro
   ↓
2. Express roteia para app.post('/api/cadastro', handleCadastro(...))
   ↓
3. handleCadastro(supabase) é chamado durante setup
   → Retorna async (req, res) => { ... }
   ↓
4. Express executa a função retornada com (req, res)
   ↓
5. Handler executa lógica
   ↓
6. res.status(201).json({ message: 'Sucesso' })
```

## 💡 Dicas e Boas Práticas

1. **Validação de Input**: Sempre validar req.body
2. **Tratamento de Erros**: Try-catch em operações Supabase
3. **Logs**: Adicionar logs para debug
4. **Reutilização**: Use helpers.js para funções comuns
5. **Database**: Use database.js para queries reutilizáveis
6. **Consistency**: Siga o padrão de resposta JSON
7. **Performance**: Cache com getAppSetting quando possível
8. **Security**: Valide tokens antes de operações críticas

## 📚 Referência Rápida

| Operação | Arquivo | Função |
|----------|---------|--------|
| Validar admin | helpers.js | `isAdminToken(req)` |
| Filtrar palavrões | helpers.js | `isProfane(texto)` |
| Normalizar descrição | helpers.js | `normalizeDescricao(value)` |
| Formato de usuário | helpers.js | `normalizeUser(user)` |
| Obter setting | database.js | `getAppSetting(supabase, key)` |
| Salvar setting | database.js | `setAppSetting(supabase, key, value)` |

---

**Dúvidas?** Consulte `REFACTORING_NOTES.md` para mais detalhes técnicos.
