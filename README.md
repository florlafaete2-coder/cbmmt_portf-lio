# 🚒 CBMMT — Painel de Gestão de Portfólio Estratégico (Kanban & Sprints)

> **Corpo de Bombeiros Militar do Estado de Mato Grosso (CBMMT)**  
> **Diretoria de Gestão Estratégica (DGE) • Banco de Projetos & Captação Extraorçamentária**

Painel executivo e interativo para gestão de portfólio de projetos, funil de editais/oportunidades de captação e ciclos ágeis de entrega (Sprints), pronto para publicação instantânea no **GitHub Pages** e integração nativa com o **GitHub Projects**.

---

## 🌟 Recursos Principais

### 1. 📌 Kanban de Projetos em Execução (Recursos Captados)
Monitoramento do ciclo de vida dos recursos garantidos (FNSP, Emendas Parlamentares Federais e Estaduais, MPE/BAPRE, Termos de Cooperação SEMA, Juizados Especiais, etc.):
- **Fase 1: Planejamento & Termos:** Formalização de plano de trabalho, abertura no SIGAdoc e justificativa técnica.
- **Fase 2: Aquisição & Licitação:** Termo de Referência (TR), coleta de 3 orçamentos, cotações e processo licitatório/pregão.
- **Fase 3: Execução & Entrega:** Empenho orçamentário, fabricação, montagem e recebimento técnico de viaturas/materiais.
- **Fase 4: Prestação de Contas:** Emissão de atestes, compilação de notas fiscais e relatório de cumprimento do objeto.
- **Fase 5: Concluído & Incorporado:** Equipamentos e ativos tombados no patrimônio e em operação nas unidades operacionais.

### 2. 🎯 Kanban de Editais & Radar de Oportunidades
Funil de captação de recursos extraorçamentários (FINEP, MMA, FUNBIO, Varas Criminais/Penas Pecuniárias, BNDES Fundo Amazônia e Propostas Estratégicas para a **COP 31**):
- **1. Radar & Mapeamento:** Oportunidades identificadas e chamadas com inscrições abertas.
- **2. Elegibilidade & Critérios:** Análise de aderência, contrapartida institucional e articulação com CONSEGs locais.
- **3. Elaboração de Proposta:** Construção de Notas Conceituais, orçamentação e preenchimento de formulários.
- **4. Submetido / Julgamento:** Propostas protocoladas formalmente aguardando julgamento e resultado.
- **5. Aprovado / Captação Concluída:** Recurso deferido e homologado, transitando para o quadro de Execução.

### 3. ⚡ Modelo de Sprints Ágeis (Ciclos de Entrega Quinzenais/Mensais)
Gestão operacional de ritmo acelerado para equipes e comissões temáticas (Incêndio Florestal, Mergulho, Urbano, Produtos Perigosos, DGE):
- Seletor de ciclos:
  - **Sprint 2026.1:** Regularização CONSEGs & Juizados Especiais (Varas Criminais)
  - **Sprint 2026.2:** Articulação Estratégica COP 31 (Hub Digital & Notas Conceituais)
  - **Sprint 2026.3:** Execução e Prestação de Contas FNSP & Emendas Parlamentares
- Colunas do ciclo: `Sprint Backlog` ➔ `A Fazer (To Do)` ➔ `Em Andamento` ➔ `Revisão Técnica/DGE` ➔ `Concluído (Done)`.
- Indicadores em tempo real de **Story Points (SP)**, barra de progresso e taxa de conclusão.

### 4. 📊 Dashboard Executivo & KPIs
- Totalizador de Recursos Captados em R$ (acumulado).
- Taxa de Execução e Liquidação Financeira.
- Distribuição de Recursos por Fonte Financiadora (Gráficos interativos).
- Volume de Oportunidades Ativas e Prazos Críticos.

### 5. 🛠️ Recursos de Interface & Usabilidade
- **Drag-and-Drop Nativo (HTML5):** Arraste cartões diretamente entre as colunas com atualização automática de valores e quantidades.
- **Filtros Dinâmicos:** Filtre em tempo real por Fonte/Patrocinador, Batalhão/Unidade Atendida e Nível de Prioridade (Crítica, Alta, Média, Baixa).
- **Busca Global Instantânea:** Pesquisa por título, processo SIGAdoc, responsável ou unidade.
- **Modo Escuro / Claro:** Alternância rápida com persistência no navegador.
- **Persistência de Dados Local (LocalStorage):** Todas as movimentações e novos itens criados permanecem salvos no seu computador.
- **Backup & Portabilidade:** Exportação e importação completa em **JSON** e download da planilha consolidada em **CSV**.

---

## 🚀 Como Publicar no GitHub (Passo a Passo)

### Opção A: Publicação Automática no GitHub Pages (Online em 2 Minutos)

Este projeto foi construído em arquitetura estática moderna (HTML5, Vanilla CSS e JS modular), sem necessidade de compilação ou Node.js.

1. Abra o terminal (PowerShell ou Git Bash) nesta pasta:
   ```bash
   git init
   git add .
   git commit -m "feat: Painel Kanban de Gestao de Portfolio CBMMT"
   git branch -M main
   ```

2. Crie um novo repositório vazio no seu GitHub (exemplo: `cbmmt-portfolio`) e conecte-o:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/cbmmt-portfolio.git
   git push -u origin main
   ```

3. No GitHub:
   - Vá em **Settings** ➔ **Pages** (no menu lateral esquerdo).
   - Em **Build and deployment > Source**, selecione: **Deploy from a branch**.
   - Em **Branch**, selecione `main` e a pasta `/ (root)`.
   - Clique em **Save**.
   *(Ou se preferir, o workflow `.github/workflows/deploy.yml` já incluso publicará via GitHub Actions automaticamente!)*

4. Pronto! Em 1 minuto seu painel estará online e acessível em:
   ```
   https://SEU-USUARIO.github.io/cbmmt-portfolio/
   ```

---

### Opção B: Uso Local (Sem Internet ou Servidor)
Basta dar **duplo clique no arquivo `index.html`** em qualquer computador com Windows, macOS ou Linux. O painel abrirá diretamente no Google Chrome, Microsoft Edge ou Firefox com todas as funções ativas!

---

## 📋 Como Configurar o GitHub Projects (Kanban Nativo do GitHub)

Caso sua diretoria prefira gerenciar o fluxo também pelo **GitHub Projects (v2)** com Issues do GitHub:

1. No repositório no GitHub, clique na aba superior **Projects** ➔ **New project**.
2. Selecione o modelo **Board**.
3. Crie os seguintes campos personalizados (**Custom Fields**):
   - `Valor (R$)` (Tipo: *Number*)
   - `Fonte / Patrocinador` (Tipo: *Single Select*: `FNSP`, `Emenda Parlamentar`, `MPE/BAPRE`, `SEMA`, `Juizados`, `COP 31`)
   - `Unidade Atendida` (Tipo: *Single Select*: `1º BBM`, `2º BBM`, `3º BBM`, `BEA`, `Quartéis do Interior`, etc.)
   - `Sprint` (Tipo: *Iteration*: ciclos de 2 a 4 semanas)
4. Os modelos de Issues já estão pré-configurados na pasta [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/):
   - `01_projeto_execucao.md` — Para novos projetos com captação garantida.
   - `02_edital_oportunidade.md` — Para novas chamadas públicas e editais.
   - `03_sprint_tarefa.md` — Para tarefas operacionais dos ciclos ágeis.

---

## 📁 Estrutura de Arquivos

```text
Organização de Portfólio/
├── index.html                   # Página principal da aplicação web (Dashboard)
├── styles.css                   # Sistema de design responsivo e temas Dark/Light
├── app.js                       # Mecanismo interativo de Kanban, drag-drop e KPIs
├── data.js                      # Base de dados curada com 194 projetos e 40 editais
├── .github/
│   ├── workflows/
│   │   └── deploy.yml           # Automação de deploy para o GitHub Pages
│   └── ISSUE_TEMPLATE/
│       ├── 01_projeto_execucao.md
│       ├── 02_edital_oportunidade.md
│       └── 03_sprint_tarefa.md
├── dados_extraidos.json         # Extração em JSON das planilhas originais
├── Banco de projetos 2.0.xlsx   # Planilha fonte CBMMT
├── Planilha editais V. 02.xlsx  # Planilha fonte de editais
└── README.md                    # Este manual de documentação
```

---

## 🔒 Segurança e Privacidade de Dados
- Todos os dados editados ou cadastrados pelo usuário ficam salvos no armazenamento local do navegador (`localStorage`).
- O botão **Backup** na barra superior permite salvar snapshots em arquivo `.json` ou exportar relatórios gerenciais para o Excel (`.csv`) a qualquer momento.

---
*Desenvolvido para apoio à tomada de decisão estratégica e celeridade nos processos de captação e entrega do CBMMT.*
