# claude-starter

Template para começar projetos com o **Claude Code** gastando menos tokens:
o **Opus pensa**, o **Sonnet programa** e o **Haiku faz o trabalho braçal**.

## Como funciona

| Fase | Modelo | Onde está configurado |
|---|---|---|
| Planejamento (plan mode) | Opus | `.claude/settings.json` → `"model": "opusplan"` |
| Implementação | Sonnet | `opusplan` troca sozinho ao sair do plan mode |
| Testes, buscas, lint, docs | Haiku | subagentes em `.claude/agents/` com `model: haiku` |

### Subagentes incluídos

| Agente | O que faz | Pode editar? |
|---|---|---|
| `explorador` | Localiza arquivos e trechos de código e resume | Não |
| `testador` | Roda os testes e resume as falhas | Não |
| `revisor-lint` | Roda lint e tipos e corrige erros mecânicos | Sim (só correções seguras) |
| `documentador` | Atualiza README, comentários e changelog | Sim (só docs) |

## Começando um projeto novo

1. No GitHub, clique em **Use this template → Create a new repository**.
2. Abra o repositório novo no app desktop do Claude (aba Code).
3. Confira se o modelo está em `opusplan` (`/model` mostra o atual).
4. Entre no plan mode (`Shift+Tab` até aparecer *plan mode*) e descreva o projeto. Exemplo:
   > Quero criar [ideia]. Proponha a stack, a estrutura de pastas e um plano em etapas pequenas.
5. Revise o plano, peça ajustes e aprove. O Sonnet implementa.
6. Ao fim de cada etapa: `use o revisor-lint e o testador`.
7. Preencha as seções *Sobre o projeto* e *Comandos* do `CLAUDE.md` assim que a stack estiver definida (ou peça para o Claude preencher).

## Dicas para economizar

- **Capriche no plano.** Quanto mais detalhado (arquivos, passos, tipos), menos o Sonnet precisa raciocinar.
- **Uma tarefa por sessão.** Use `/clear` ao trocar de assunto; contexto acumulado custa caro.
- **Não delegue o que é pequeno.** Subagente começa do zero e relê o contexto.
- **Bug cabeludo?** `/model opus` só para ele e depois `/model opusplan` de novo.
- **Acompanhe o consumo** com `/usage`.

## Ajustes opcionais

Fazer os subagentes que não definem modelo próprio usarem Haiku, em `.claude/settings.json` (para forçar em todos, adicione também `"CLAUDE_CODE_SUBAGENT_MODEL_FORCE": "1"`):

```json
{
  "model": "opusplan",
  "env": {
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

Referência: [Configuração de modelos](https://code.claude.com/docs/en/model-config) · [Subagentes](https://code.claude.com/docs/en/sub-agents)
