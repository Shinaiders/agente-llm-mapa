# Mapa do Agente LLM — design

Data: 2026-11-14 · Status: aguardando aprovação

## Intenção

Uma página React que ensina a montar um agente LLM do zero. O centro é um
diagrama animado que mostra onde cada peça fica e para onde a informação vai.
Clicar numa peça abre o tutorial dela: uma cena animada com narração (voz do
OmniVoice, linguagem para alguém de 12 anos) e, abaixo, o passo a passo
escrito com código de verdade.

Pedido pelo Lucas. Público assumido (decisão do Claude, não confirmada):
iniciante em IA que sabe programar um pouco.

## Objetivos

- Ver num só mapa tudo que entra na montagem de um agente e como se liga.
- Cada assunto responde: o que é, para que serve, onde se encaixa, como montar.
- Visual caprichado, com movimento que explica (não enfeite).
- Narração simples o bastante para uma criança de 12 anos entender.

## Fora do escopo

- Exportar vídeo MP4 (decidido pelo Lucas: animação na página com áudio).
- Agente rodando de verdade no navegador, backend, login, chave de API na página.
- Treinar modelo do zero, matemática de redes neurais, geração de imagem e voz.
- Outros idiomas além de português do Brasil.
- Tema claro.

## O que seria um fracasso mesmo funcionando

- Parecer um template genérico ou um fluxograma de ferramenta pronta.
- Narração com jargão sem explicar, ou em tom de aula chata.
- Animação fora de tempo com a voz.
- Tutorial virar parede de texto sem código que dê para copiar.

## Assuntos (33, em 6 camadas)

Os marcados com ★ são os 8 pedidos primeiro e ficam prontos na etapa 1.

| Camada | Assuntos |
|---|---|
| Cérebro | LLM ★ · tokens e janela de contexto · prompt e system prompt · saída estruturada · alucinação · raciocínio (thinking) · escolha do modelo |
| Conhecimento | embeddings · banco vetorial · RAG ★ · memória curta e longa · engenharia de contexto · fine-tuning ★ |
| Ação | tools (function calling) · MCP ★ · loop do agente · planejamento · multi-agentes |
| Confiabilidade | guardrails ★ · fallback e retry ★ · roteador de modelos |
| Segurança | prompt injection e jailbreak · permissões e menor privilégio · segredos e chaves de API · privacidade e dados pessoais (LGPD) · segurança de ferramentas e MCP de terceiros · sandbox e execução de código · humano no meio (aprovação) · limites de gasto e abuso |
| Qualidade e custo | evals ★ · observabilidade (traces, logs, auditoria) · cache ★ · streaming |

Subtemas que entram dentro de um nó, sem nó próprio:
RAG (chunking, reranking, busca híbrida) · LLM (temperatura, multimodal) ·
fine-tuning (LoRA, destilação, dados sintéticos) · cache (de resposta e de
prompt) · multi-agentes (A2A) · MCP (skills) · qualidade e custo (preço por
token, limite de requisições, lote).

## Abordagens consideradas

1. **SVG desenhado à mão + Motion (escolhida).** Controle total do visual,
   leve; cada cena é feita uma a uma.
2. React Flow para o diagrama. Zoom e arrastar prontos, mas com cara de
   ferramenta genérica, o que contraria "bem estilizado".
3. Remotion Player para as cenas. Linha do tempo por quadro, mas pesado, com
   licença própria e sem ganho já que não se exporta vídeo.

O Lucas deixou as escolhas técnicas com o Claude; a 1 é decisão do Claude.

## Como a página funciona

### Mapa (tela inicial)

- Seis faixas horizontais, uma por camada, cada uma com sua cor.
- Caminho principal desenhado por cima das faixas:
  pergunta → guardrails → cache → LLM ⇄ (tools/MCP, RAG, memória) →
  guardrails → resposta. Evals, fine-tuning e observabilidade ficam fora da
  linha, ligados por traço pontilhado.
- Um pulso de luz percorre o caminho em loop. Às vezes pega o atalho do cache;
  às vezes cai no fallback. Os nós acendem quando o pulso passa.
- Cada nó mostra nome, ícone e um trecho de código de 2 a 4 linhas.
- Passar o mouse destaca o nó e suas ligações e apaga o resto.
- Navegável por teclado; nós são botões com nome acessível.
- Em tela estreita, as faixas empilham e o mapa rola na vertical.

### Mapa interativo (pedido do Lucas: "o diagrama tem que ser algo interativo")

O mapa não é só para olhar e clicar. A forma abaixo é proposta do Claude:

- **Cenários.** Um seletor troca o que entra no agente e o pulso faz outro
  caminho: pedido normal · pergunta repetida (atalho do cache) · tentativa
  de golpe (barrada na segurança) · modelo fora do ar (cai no fallback) ·
  pergunta sobre o cardápio (passa pelo RAG) · pedido que precisa de
  ferramenta (passa por tools/MCP).
- **Ligar e desligar peças.** Cada nó tem um interruptor. Desligar muda o
  resultado na hora: sem guardrails o golpe passa; sem cache a pergunta
  repetida custa e demora de novo; sem RAG o agente inventa o preço; sem
  fallback a resposta vira erro. Um painel pequeno mostra resposta, tempo
  e custo (valores ilustrativos, não medidos).
- **Passo a passo.** Play/pausa e avançar/voltar um salto por vez; em cada
  salto o nó ativo mostra o que recebeu e o que devolveu.
- **Zoom e arrastar** o mapa; destaque das ligações ao passar o mouse.
- Tudo é simulação escrita à mão (tabela de cenário × peças ligadas →
  caminho e resultado). Nenhum modelo é chamado.

### Cenas ligadas uma na outra (pedido do Lucas: "as animações têm que ligar uma na outra")

Proposta do Claude para o que "ligar" significa:

- **Um objeto só atravessa tudo:** o cartão do pedido do cliente. Ele é o
  pulso no mapa e é o personagem de todas as cenas. Cada cena começa com o
  cartão chegando do nó anterior e termina com ele saindo para o próximo.
- **Modo viagem.** Ao terminar uma cena, a câmera volta ao mapa, o cartão
  corre pela ligação até o próximo nó e a cena seguinte abre e toca
  sozinha. Dá para desligar o avanço automático e para pular.
- A ordem da viagem segue o cenário escolhido; assuntos fora da linha
  (evals, fine-tuning, observabilidade) entram ao final como "bastidores".
- Mapa e cenas dividem o mesmo desenho de nós e a mesma cor por camada,
  para a passagem de um para o outro não ter corte.

### Tutorial (ao clicar num nó)

O nó expande até virar a página do assunto (transição de layout
compartilhado). URL própria por assunto (`#/assunto/rag`), para dar para
compartilhar e voltar.

De cima para baixo:

1. **Cena narrada.** Palco animado + play/pausa, barra de progresso
   clicável, velocidade, legenda, recomeçar.
2. **O que é** — a analogia da narração, em texto.
3. **Para que serve** — o problema que resolve, com um antes e depois.
4. **Onde se encaixa** — mini-mapa com este nó e os vizinhos acesos.
5. **Como montar** — passo a passo numerado com código copiável.
6. **Erros comuns** — 3 a 5 armadilhas.
7. **Próximo assunto** — segue a ordem sugerida de aprendizado.

### Exemplo único do começo ao fim

Todos os códigos e cenas usam o mesmo agente: **Pip, o atendente de uma
pizzaria** (decisão do Claude). Pip anota pedidos (tools), consulta o
cardápio (RAG), lembra do cliente (memória), não revela dados de outros
clientes (segurança) e assim por diante. Um exemplo só deixa visível como as
peças se somam.

Código em TypeScript, usando a API do Claude como provedor padrão. Quem
construir deve conferir nomes de modelo e assinaturas na documentação atual
antes de escrever os trechos, não de memória.

## Cena sincronizada com a voz

- A narração de cada assunto é uma lista de frases (6 a 10; 45 a 75 segundos).
- Um script gera o áudio **frase por frase** com o `omnivoice-infer` de
  `~/.venvs/omnivoice`, mede a duração de cada um com `ffprobe`, junta tudo
  num arquivo por assunto com `ffmpeg` e grava um `cues.json` com início e
  fim de cada frase.
- A cena declara passos ligados ao índice da frase. Um hook lê o tempo do
  `<audio>` e diz qual frase está tocando; a cena anima para aquele passo.
  Arrastar a barra leva a cena ao passo certo.
- Frases que não mudaram não são geradas de novo (hash do texto).
- Uma voz só para tudo. Voz criada por descrição, não clone de pessoa real.
  Quem construir verifica no `--help` como fixar a mesma voz entre frases
  (por exemplo, reutilizando um áudio de referência gerado uma vez).
- Os pesos do modelo ainda não estão no cache; a primeira execução baixa.
- Com "reduzir movimento" ligado no sistema, a cena troca de passo com
  fade simples, sem deslocamentos.
- Os áudios gerados ficam versionados no projeto, para a página funcionar
  sem precisar rodar o OmniVoice.

## Tom da narração

- Uma analogia do dia a dia por assunto (cache = caderno de respostas
  prontas; guardrails = o segurança da porta; RAG = consultar o livro antes
  de responder; fine-tuning = treinar para a prova).
- Frases curtas. Termo técnico só depois da analogia, e sempre explicado.
- Fala de "você", sem infantilizar.

## Direção visual

- Fundo escuro, uma cor por camada, código em fonte mono dentro de
  cartões, brilho só no que está ativo.
- Movimento com propósito: o pulso mostra o fluxo, a expansão do nó mostra
  de onde o tutorial veio.
- Detalhes de tipografia, paleta e ícones ficam com quem construir, desde
  que não caia no visual genérico descrito nos fracassos.

## Estrutura técnica (decisões do Claude)

- Vite + React + TypeScript, pnpm. Motion para animação. Tailwind para
  estilo. Shiki para colorir código. Tutoriais em MDX.
- Um assunto = uma pasta: metadados (título, camada, ligações, trecho do
  nó), cena, frases da narração, tutorial. Adicionar assunto = adicionar pasta.
- Um script de verificação falha se algum assunto estiver sem cena,
  narração, áudio ou tutorial.
- Testes: unidade para o cálculo dos cues e para o hook de frase atual;
  conferência visual no navegador para mapa e cenas.

## Etapas

1. **Base + 8 originais.** Mapa interativo (cenários, interruptores, passo
   a passo, modo viagem) com os 33 nós (os 25 restantes aparecem
   como "em breve"), motor de cena, pipeline de voz e os 8 assuntos ★
   completos. O Lucas revisa o estilo aqui.
2. **Os outros 25**, por camada, no mesmo molde, com os ajustes da revisão.

## Fica com quem construir

- Composição exata do mapa, paleta, tipografia, ícones.
- Roteiro e desenho de cada cena.
- Flags exatas do `omnivoice-infer` e formato final do áudio.
