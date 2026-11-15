// Tutorial "Memória": retenção de preferências e histórico de clientes
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic()

export interface PerfilCliente {
  id: string
  nome: string
  preferencias: string[]
  restricoes: string[]
}

export const bancoMemoria = new Map<string, PerfilCliente>([
  [
    '1199991234',
    {
      id: '1199991234',
      nome: 'Ana',
      preferencias: ['massa fina', 'borda recheada'],
      restricoes: ['alérgica a camarão', 'sem cebola'],
    },
  ],
])

export async function atenderCliente(telefone: string, mensagem: string): Promise<string> {
  const perfil = bancoMemoria.get(telefone)

  const contextoMemoria = perfil
    ? `DADOS DA CLIENTE ${perfil.nome}:\n- Preferências: ${perfil.preferencias.join(', ')}\n- Restrições: ${perfil.restricoes.join(', ')}`
    : 'CLIENTE NOVO: acolha com gentileza e descubra como ajudar.'

  const resposta = await claude.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 1024,
    system: `Você é o Pip, atendente da Pizzaria do Bairro.\n${contextoMemoria}`,
    messages: [{ role: 'user', content: mensagem }],
  })

  return resposta.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
}
