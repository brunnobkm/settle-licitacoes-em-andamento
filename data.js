// =====================================================================
// Etapas do pipeline = COLUNAS do kanban.
// O kanban agrupa cards por `etapa` (não confundir com `status` do edital,
// que é uma propriedade separada do card e renderiza como pill colorido).
// =====================================================================
const ETAPAS = [
  { key: "analise",     label: "Análise de oportunidades", dot: "#F59E0B" },
  { key: "preparacao",  label: "Preparação de Proposta",   dot: "#3B82F6" },
  { key: "disputa",     label: "Disputa de Classificação", dot: "#8B5CF6" },
  { key: "habilitacao", label: "Processo de Habilitação",  dot: "#F97316" },
  { key: "homologacao", label: "Homologação",              dot: "#22C55E" }
];

// =====================================================================
// Status do edital (pill colorido dentro do card). Tabela espelha o
// `statusDisponiveis` de licitacoes-em-andamento-card/prototype.html.
// =====================================================================
const STATUS_EDITAL = [
  { id: "abertas",    label: "Abertas para participação", bg: "#dcfce7", text: "#15803d" },
  { id: "em-disputa", label: "Em disputa ou Homologação", bg: "#fef3c7", text: "#b45309" },
  { id: "suspensa",   label: "Suspensa",                  bg: "#fef3c7", text: "#b45309" },
  { id: "anulada",    label: "Anulada",                   bg: "#fee2e2", text: "#dc2626" },
  { id: "revogada",   label: "Revogada",                  bg: "#fee2e2", text: "#dc2626" },
  { id: "homologada", label: "Homologada",                bg: "#dcfce7", text: "#15803d" },
  { id: "deserta",    label: "Deserta ou Fracassada",     bg: "#fee2e2", text: "#dc2626" }
];

// =====================================================================
// Pessoas — mesmo schema do card-fonte (id, nome, cor).
// =====================================================================
const PESSOAS = [
  { id: 1, nome: "Brunno Krier Martins",        cor: "#f59e0b" },
  { id: 2, nome: "Fabio Almeida Lopes Pereira", cor: "#10b981" },
  { id: 3, nome: "Maria da Silva",              cor: "#3b82f6" },
  { id: 4, nome: "Ana Lima",                    cor: "#ec4899" },
  { id: 5, nome: "Diego Pires",                 cor: "#8b5cf6" },
  { id: 6, nome: "Eduardo Reis",                cor: "#06b6d4" },
  { id: 7, nome: "Fernanda Ávila",              cor: "#ef4444" },
  { id: 8, nome: "Gustavo Néri",                cor: "#22c55e" },
  { id: 9, nome: "Helena Costa",                cor: "#a855f7" },
  { id: 10, nome: "Carla Souza",                cor: "#0ea5e9" }
];

// =====================================================================
// Cor de fundo por segmento (mesma paleta do card-fonte).
// =====================================================================
const SEGMENTO_CORES = {
  "Tecnologia":  "#4579A6",
  "Materiais":   "#694500",
  "Saúde":       "#2B6339",
  "Educação":    "#46467D",
  "Engenharia":  "#A26053",
  "Serviços":    "#835B8E",
  "Construção":  "#707735",
  "Alimentação": "#783B54",
  "Tecnologia da Informação e Comunicação":         "#4579A6",
  "Materiais de Construção e Engenharia Civil":     "#707735",
  "Equipamentos e Suprimentos Médico-Hospitalares": "#2B6339",
  // novos rótulos usados no kanban (mantém paleta consistente)
  "Aeroportos":     "#46467D",
  "Infraestrutura": "#707735",
  "Limpeza":        "#2B6339",
  "TI":             "#4579A6",
  "Segurança":      "#46467D",
  "Transporte":     "#835B8E",
  "Mobiliário":     "#694500"
};
const PALETA_SEGMENTOS = ["#4579A6", "#46467D", "#835B8E", "#783B54", "#A26053", "#694500", "#2B6339", "#707735"];

function corDoSegmento(nome) {
  if (SEGMENTO_CORES[nome]) return SEGMENTO_CORES[nome];
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = (hash * 31 + nome.charCodeAt(i)) >>> 0;
  return PALETA_SEGMENTOS[hash % PALETA_SEGMENTOS.length];
}

// =====================================================================
// Licitações mock.
// `etapa`  = coluna do kanban (chave de ETAPAS)
// `status` = situação do edital (id de STATUS_EDITAL) — vira pill no card
// =====================================================================
const LICITACOES = [
  // ---- Análise de oportunidades ----
  {
    id: "1431011",
    codigoEdital: "048/2026",
    titulo: "Reforma do pátio de aeronaves norte — Santos Dumont (SBRJ)",
    segmentos: ["Aeroportos", "Infraestrutura"],
    orgao: "INFRAERO / Aeroporto Santos Dumont (SBRJ)",
    objeto: "[LICITANET] - CONTRATAÇÃO DE EMPRESA ESPECIALIZADA PARA EXECUÇÃO DE SERVIÇOS DE ENGENHARIA, COM FORNECIMENTO DE MATERIAIS, MÃO DE OBRA E EQUIPAMENTOS, PARA REFORMA DO PÁTIO DE AERONAVES NORTE DO AEROPORTO SANTOS DUMONT.",
    etapa: "analise",
    status: "abertas",
    responsaveis: [1, 2, 3],
    dataEnvio: "2026-05-19",
    cidade: "Silveira Martins",
    estado: "RS",
    valorGlobal: 220950.23,
    itensMatch: 12
  },
  {
    id: "1430952",
    codigoEdital: "112/2026",
    titulo: "Limpeza hospitalar — Hospital Federal de Bonsucesso",
    segmentos: ["Saúde", "Limpeza"],
    orgao: "Ministério da Saúde / Hospital Federal de Bonsucesso",
    objeto: "[LICITANET] - SISTEMA DE REGISTRO DE PREÇOS VISANDO A FUTURA E EVENTUAL CONTRATAÇÃO DE EMPRESA ESPECIALIZADA NA PRESTAÇÃO DE SERVIÇOS CONTINUADOS DE LIMPEZA HOSPITALAR.",
    etapa: "analise",
    status: "abertas",
    responsaveis: [10],
    dataEnvio: "2026-05-22",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    valorGlobal: 4200000,
    itensMatch: 3
  },
  {
    id: "1430887",
    codigoEdital: "022/2026",
    titulo: "Merenda escolar — ensino fundamental e infantil de BH",
    segmentos: ["Educação", "Alimentação"],
    orgao: "Prefeitura Municipal de Belo Horizonte / Secretaria de Educação",
    objeto: "AQUISIÇÃO DE GÊNEROS ALIMENTÍCIOS PARA COMPOSIÇÃO DA MERENDA ESCOLAR DAS UNIDADES DE ENSINO FUNDAMENTAL E EDUCAÇÃO INFANTIL DO MUNICÍPIO, COM ENTREGA PROGRAMADA E PRIORIDADE PARA AGRICULTURA FAMILIAR.",
    etapa: "analise",
    status: "abertas",
    responsaveis: [5, 6, 7],
    dataEnvio: "2026-06-04",
    cidade: "Belo Horizonte",
    estado: "MG",
    valorGlobal: 7850000,
    itensMatch: 22
  },

  // ---- Preparação de Proposta ----
  {
    id: "1430715",
    codigoEdital: "089/2026",
    titulo: "Solução EDR de proteção de endpoints — TJSP",
    segmentos: ["TI", "Segurança"],
    orgao: "TJSP / Diretoria de Tecnologia da Informação",
    objeto: "REGISTRO DE PREÇOS PARA AQUISIÇÃO DE SOLUÇÃO DE PROTEÇÃO DE ENDPOINTS (EDR), COM SERVIÇOS DE IMPLANTAÇÃO E SUPORTE TÉCNICO, ATENDENDO ESTAÇÕES E SERVIDORES DO TJSP.",
    etapa: "preparacao",
    status: "abertas",
    responsaveis: [1, 8],
    dataEnvio: "2026-05-26",
    cidade: "São Paulo",
    estado: "SP",
    valorGlobal: 9120000,
    itensMatch: 5
  },
  {
    id: "1430660",
    codigoEdital: "156/2026",
    titulo: "Restauração BR-381/MG — BH a Governador Valadares",
    segmentos: ["Construção", "Infraestrutura"],
    orgao: "DNIT / Superintendência Regional em Minas Gerais",
    objeto: "EXECUÇÃO DE OBRAS DE RESTAURAÇÃO E MANUTENÇÃO DA RODOVIA BR-381/MG, TRECHO BELO HORIZONTE-GOVERNADOR VALADARES, INCLUINDO RECAPEAMENTO E SINALIZAÇÃO HORIZONTAL E VERTICAL.",
    etapa: "preparacao",
    status: "abertas",
    responsaveis: [9, 4],
    dataEnvio: "2026-06-15",
    cidade: "Belo Horizonte",
    estado: "MG",
    valorGlobal: 48300000,
    itensMatch: 11
  },
  {
    id: "1430501",
    codigoEdital: "017/2026",
    titulo: "Renovação da frota — transporte metropolitano de Curitiba",
    segmentos: ["Transporte"],
    orgao: "Governo do Estado do Paraná / Secretaria de Infraestrutura e Logística",
    objeto: "AQUISIÇÃO DE ÔNIBUS URBANOS COM ACESSIBILIDADE PARA RENOVAÇÃO DA FROTA DO TRANSPORTE COLETIVO METROPOLITANO DE CURITIBA, ATENDENDO PCD E NORMAS DE EMISSÃO PROCONVE P-8.",
    etapa: "preparacao",
    status: "abertas",
    responsaveis: [10, 5],
    dataEnvio: "2026-05-28",
    cidade: "Curitiba",
    estado: "PR",
    valorGlobal: 64900000,
    itensMatch: 2
  },

  // ---- Disputa de Classificação ----
  {
    id: "1430340",
    codigoEdital: "201/2026",
    titulo: "Vigilância armada e desarmada — sede da PF em Brasília",
    segmentos: ["Segurança"],
    orgao: "Ministério da Justiça / Polícia Federal — Superintendência DF",
    objeto: "CONTRATAÇÃO DE SERVIÇOS CONTINUADOS DE VIGILÂNCIA ARMADA E DESARMADA, COM FORNECIMENTO DE POSTOS DE TRABALHO, UNIFORMES E EQUIPAMENTOS DE COMUNICAÇÃO TETRA, NA SEDE DA POLÍCIA FEDERAL EM BRASÍLIA.",
    etapa: "disputa",
    status: "em-disputa",
    responsaveis: [6],
    dataEnvio: "2026-05-24",
    cidade: "Brasília",
    estado: "DF",
    valorGlobal: 18700000,
    itensMatch: 6
  },
  {
    id: "1430210",
    codigoEdital: "067/2026",
    titulo: "Equipamentos hospitalares de alta complexidade — HGF",
    segmentos: ["Saúde"],
    orgao: "Secretaria de Estado da Saúde do Ceará / Hospital Geral de Fortaleza",
    objeto: "AQUISIÇÃO DE EQUIPAMENTOS HOSPITALARES DE ALTA COMPLEXIDADE, INCLUINDO VENTILADORES PULMONARES, MONITORES MULTIPARÂMETROS E BOMBAS DE INFUSÃO, COM GARANTIA E TREINAMENTO TÉCNICO.",
    etapa: "disputa",
    status: "em-disputa",
    responsaveis: [4, 7, 8],
    dataEnvio: "2026-05-23",
    cidade: "Fortaleza",
    estado: "CE",
    valorGlobal: 22400000,
    itensMatch: 14
  },
  {
    id: "1430105",
    codigoEdital: "009/2026",
    titulo: "Mobiliário corporativo ergonômico — UFRGS",
    segmentos: ["Mobiliário"],
    orgao: "UFRGS / Pró-Reitoria de Planejamento",
    objeto: "REGISTRO DE PREÇOS PARA AQUISIÇÃO DE MOBILIÁRIO CORPORATIVO ERGONÔMICO, COM CADEIRAS, MESAS E ARMÁRIOS, DESTINADO ÀS UNIDADES ACADÊMICAS E ADMINISTRATIVAS DA UFRGS.",
    etapa: "disputa",
    status: "suspensa",
    responsaveis: [1, 9],
    dataEnvio: "2026-06-10",
    cidade: "Porto Alegre",
    estado: "RS",
    valorGlobal: 3180000,
    itensMatch: 9
  },

  // ---- Processo de Habilitação ----
  {
    id: "1429988",
    codigoEdital: "234/2026",
    titulo: "Refeições preparadas — alimentação escolar de Salvador",
    segmentos: ["Alimentação", "Educação"],
    orgao: "Prefeitura Municipal de Salvador / Secretaria Municipal de Educação",
    objeto: "FORNECIMENTO DE REFEIÇÕES PREPARADAS PARA ATENDIMENTO DO PROGRAMA DE ALIMENTAÇÃO ESCOLAR NAS UNIDADES DA REDE MUNICIPAL DE ENSINO DE SALVADOR.",
    etapa: "habilitacao",
    status: "em-disputa",
    responsaveis: [10],
    dataEnvio: "2026-05-12",
    cidade: "Salvador",
    estado: "BA",
    valorGlobal: 11650000,
    itensMatch: 4
  },
  {
    id: "1429820",
    codigoEdital: "145/2026",
    titulo: "Limpeza e conservação predial — campi da UFPE",
    segmentos: ["Limpeza"],
    orgao: "UFPE / Prefeitura Universitária",
    objeto: "PRESTAÇÃO DE SERVIÇOS CONTINUADOS DE LIMPEZA, ASSEIO E CONSERVAÇÃO PREDIAL NAS DEPENDÊNCIAS DOS CAMPI DA UNIVERSIDADE FEDERAL DE PERNAMBUCO.",
    etapa: "habilitacao",
    status: "em-disputa",
    responsaveis: [5, 6],
    dataEnvio: "2026-05-08",
    cidade: "Recife",
    estado: "PE",
    valorGlobal: 5960000,
    itensMatch: 2
  },

  // ---- Homologação ----
  {
    id: "1429401",
    codigoEdital: "045/2026",
    titulo: "Licenças de produtividade em nuvem — TCU",
    segmentos: ["TI"],
    orgao: "TCU / Secretaria de Tecnologia da Informação",
    objeto: "AQUISIÇÃO DE LICENÇAS DE SOFTWARE DE PRODUTIVIDADE E COLABORAÇÃO EM NUVEM, COM SUPORTE TÉCNICO E TREINAMENTO, PARA OS USUÁRIOS DO TRIBUNAL DE CONTAS DA UNIÃO.",
    etapa: "homologacao",
    status: "homologada",
    responsaveis: [1],
    dataEnvio: "2026-04-22",
    cidade: "Brasília",
    estado: "DF",
    valorGlobal: 14120000,
    itensMatch: 1
  },
  {
    id: "1429220",
    codigoEdital: "178/2026",
    titulo: "Veículos utilitários blindados para transporte de custódia",
    segmentos: ["Transporte"],
    orgao: "Governo do Estado de São Paulo / Secretaria da Administração Penitenciária",
    objeto: "AQUISIÇÃO DE VEÍCULOS UTILITÁRIOS BLINDADOS PARA TRANSPORTE DE CUSTÓDIA, COM ADAPTAÇÕES DE SEGURANÇA E SISTEMA DE COMUNICAÇÃO TETRA.",
    etapa: "homologacao",
    status: "anulada",
    responsaveis: [7, 9],
    dataEnvio: "2026-04-18",
    cidade: "São Paulo",
    estado: "SP",
    valorGlobal: 19800000,
    itensMatch: 1
  },
  {
    id: "1429110",
    codigoEdital: "033/2026",
    titulo: "Restauro do patrimônio histórico — centro histórico de Salvador",
    segmentos: ["Construção"],
    orgao: "IPHAN / Superintendência Estadual da Bahia",
    objeto: "EXECUÇÃO DE OBRAS DE RESTAURO DO PATRIMÔNIO HISTÓRICO EDIFICADO DO CENTRO HISTÓRICO DE SALVADOR, ATENDENDO ÀS DIRETRIZES TÉCNICAS DO IPHAN.",
    etapa: "homologacao",
    status: "deserta",
    responsaveis: [6, 10],
    dataEnvio: "2026-04-09",
    cidade: "Salvador",
    estado: "BA",
    valorGlobal: 6540000,
    itensMatch: 4
  },

  // ====== 20 licitações com dataEnvio = 2026-05-21 (hoje no protótipo) ======
  // Demo: ativa o dot vermelho + testa volume grande num único dia do calendar.
  { id:"1432001", codigoEdital:"301/2026", titulo:"Gases medicinais — HC FMUSP", segmentos:["Saúde","Materiais"], orgao:"USP / Hospital das Clínicas da FMUSP", objeto:"AQUISIÇÃO DE GASES MEDICINAIS, INCLUINDO OXIGÊNIO, ÓXIDO NITROSO E AR COMPRIMIDO, COM FORNECIMENTO PROGRAMADO.", etapa:"analise", status:"abertas", responsaveis:[4,7], dataEnvio:"2026-05-21", cidade:"São Paulo", estado:"SP", valorGlobal:2380000, itensMatch:4 },
  { id:"1432002", codigoEdital:"302/2026", titulo:"Fardamento operacional — PM-SP", segmentos:["Segurança","Materiais"], orgao:"Governo do Estado de São Paulo / Polícia Militar", objeto:"REGISTRO DE PREÇOS PARA AQUISIÇÃO DE FARDAMENTO OPERACIONAL E COLETES BALÍSTICOS PARA EFETIVO DA POLÍCIA MILITAR.", etapa:"analise", status:"abertas", responsaveis:[3], dataEnvio:"2026-05-21", cidade:"São Paulo", estado:"SP", valorGlobal:5640000, itensMatch:8 },
  { id:"1432003", codigoEdital:"303/2026", titulo:"Software de gestão acadêmica — UFABC", segmentos:["TI"], orgao:"UFABC / Pró-Reitoria de Tecnologia da Informação", objeto:"LICENCIAMENTO E IMPLANTAÇÃO DE SISTEMA INTEGRADO DE GESTÃO ACADÊMICA, COM MÓDULOS DE MATRÍCULA, NOTAS E DIPLOMAS.", etapa:"preparacao", status:"abertas", responsaveis:[1,8], dataEnvio:"2026-05-21", cidade:"Santo André", estado:"SP", valorGlobal:1820000, itensMatch:2 },
  { id:"1432004", codigoEdital:"304/2026", titulo:"Catering escolar — rede municipal Curitiba", segmentos:["Alimentação","Educação"], orgao:"Prefeitura Municipal de Curitiba / Secretaria de Educação", objeto:"FORNECIMENTO DE REFEIÇÕES PRONTAS PARA O PROGRAMA DE ALIMENTAÇÃO ESCOLAR DAS CRECHES E UNIDADES DE ENSINO FUNDAMENTAL.", etapa:"preparacao", status:"abertas", responsaveis:[10,5], dataEnvio:"2026-05-21", cidade:"Curitiba", estado:"PR", valorGlobal:9450000, itensMatch:6 },
  { id:"1432005", codigoEdital:"305/2026", titulo:"Caminhões coletores — DMLU Porto Alegre", segmentos:["Transporte","Limpeza"], orgao:"Prefeitura de Porto Alegre / DMLU", objeto:"AQUISIÇÃO DE CAMINHÕES COLETORES COMPACTADORES PARA RENOVAÇÃO DA FROTA DE LIMPEZA URBANA.", etapa:"disputa", status:"em-disputa", responsaveis:[9], dataEnvio:"2026-05-21", cidade:"Porto Alegre", estado:"RS", valorGlobal:12300000, itensMatch:3 },
  { id:"1432006", codigoEdital:"306/2026", titulo:"Modernização de subestação 138 kV — Eletrobras", segmentos:["Engenharia","Infraestrutura"], orgao:"Eletrobras / Diretoria de Operação", objeto:"OBRAS DE MODERNIZAÇÃO DA SUBESTAÇÃO ELÉTRICA DE 138 KV, INCLUINDO SUBSTITUIÇÃO DE TRANSFORMADORES E SISTEMA DE PROTEÇÃO.", etapa:"preparacao", status:"abertas", responsaveis:[2,9], dataEnvio:"2026-05-21", cidade:"Brasília", estado:"DF", valorGlobal:38700000, itensMatch:5 },
  { id:"1432007", codigoEdital:"307/2026", titulo:"Pavimentação asfáltica — bairros sul de Vitória", segmentos:["Construção","Infraestrutura"], orgao:"Prefeitura Municipal de Vitória / Secretaria de Obras", objeto:"EXECUÇÃO DE OBRAS DE PAVIMENTAÇÃO ASFÁLTICA E DRENAGEM EM 22 RUAS DOS BAIRROS DA REGIÃO SUL DE VITÓRIA.", etapa:"analise", status:"abertas", responsaveis:[4], dataEnvio:"2026-05-21", cidade:"Vitória", estado:"ES", valorGlobal:14200000, itensMatch:11 },
  { id:"1432008", codigoEdital:"308/2026", titulo:"Carteiras escolares — rede estadual do Pará", segmentos:["Educação","Mobiliário"], orgao:"Governo do Estado do Pará / Secretaria de Educação", objeto:"AQUISIÇÃO DE CARTEIRAS ESCOLARES INDIVIDUAIS PARA AS ESCOLAS DA REDE ESTADUAL DE ENSINO DO PARÁ.", etapa:"analise", status:"abertas", responsaveis:[7,3], dataEnvio:"2026-05-21", cidade:"Belém", estado:"PA", valorGlobal:6890000, itensMatch:2 },
  { id:"1432009", codigoEdital:"309/2026", titulo:"Sistema de monitoramento de tráfego — DER-MG", segmentos:["TI","Transporte"], orgao:"DER-MG / Departamento de Engenharia Rodoviária", objeto:"IMPLANTAÇÃO DE SISTEMA INTEGRADO DE MONITORAMENTO DE TRÁFEGO COM CFTV E SENSORES EM 14 PONTOS DA MALHA RODOVIÁRIA.", etapa:"disputa", status:"em-disputa", responsaveis:[8,1], dataEnvio:"2026-05-21", cidade:"Belo Horizonte", estado:"MG", valorGlobal:7340000, itensMatch:9 },
  { id:"1432010", codigoEdital:"310/2026", titulo:"Manutenção de geradores — Banco do Brasil", segmentos:["Engenharia","Serviços"], orgao:"Banco do Brasil / Diretoria de Infraestrutura", objeto:"CONTRATAÇÃO DE SERVIÇOS DE MANUTENÇÃO PREVENTIVA E CORRETIVA DOS GERADORES DE ENERGIA DAS AGÊNCIAS DO DF.", etapa:"habilitacao", status:"em-disputa", responsaveis:[6], dataEnvio:"2026-05-21", cidade:"Brasília", estado:"DF", valorGlobal:1980000, itensMatch:1 },
  { id:"1432011", codigoEdital:"311/2026", titulo:"Equipamentos de fisioterapia — SUS Joinville", segmentos:["Saúde","Equipamentos e Suprimentos Médico-Hospitalares"], orgao:"Prefeitura Municipal de Joinville / Secretaria de Saúde", objeto:"AQUISIÇÃO DE EQUIPAMENTOS DE FISIOTERAPIA E REABILITAÇÃO PARA AS UNIDADES DE ATENÇÃO ESPECIALIZADA.", etapa:"analise", status:"abertas", responsaveis:[5], dataEnvio:"2026-05-21", cidade:"Joinville", estado:"SC", valorGlobal:980000, itensMatch:7 },
  { id:"1432012", codigoEdital:"312/2026", titulo:"Reforma de delegacias — SSP-SP", segmentos:["Construção","Segurança"], orgao:"Governo do Estado de São Paulo / Secretaria de Segurança Pública", objeto:"EXECUÇÃO DE OBRAS DE REFORMA E ADAPTAÇÃO DE 12 DELEGACIAS DA CAPITAL E DA REGIÃO METROPOLITANA DE SÃO PAULO.", etapa:"preparacao", status:"abertas", responsaveis:[2], dataEnvio:"2026-05-21", cidade:"São Paulo", estado:"SP", valorGlobal:8120000, itensMatch:12 },
  { id:"1432013", codigoEdital:"313/2026", titulo:"Materiais de laboratório — Fiocruz", segmentos:["Saúde","Materiais"], orgao:"Fundação Oswaldo Cruz / Instituto de Tecnologia em Imunobiológicos", objeto:"REGISTRO DE PREÇOS PARA AQUISIÇÃO DE MATERIAIS DE CONSUMO LABORATORIAL, INCLUINDO REAGENTES E VIDRARIAS.", etapa:"disputa", status:"em-disputa", responsaveis:[7,4], dataEnvio:"2026-05-21", cidade:"Rio de Janeiro", estado:"RJ", valorGlobal:3450000, itensMatch:18 },
  { id:"1432014", codigoEdital:"314/2026", titulo:"Aquisição de vacinas — Ministério da Saúde", segmentos:["Saúde"], orgao:"Ministério da Saúde / Departamento de Imunizações", objeto:"AQUISIÇÃO DE IMUNOBIOLÓGICOS PARA O PROGRAMA NACIONAL DE IMUNIZAÇÕES, COM FORNECIMENTO PROGRAMADO PARA AS UNIDADES FEDERATIVAS.", etapa:"preparacao", status:"abertas", responsaveis:[1,8,3], dataEnvio:"2026-05-21", cidade:"Brasília", estado:"DF", valorGlobal:124800000, itensMatch:5 },
  { id:"1432015", codigoEdital:"315/2026", titulo:"Caminhões de bombeiros — CBMERJ", segmentos:["Transporte","Segurança"], orgao:"Corpo de Bombeiros Militar do RJ / Diretoria de Logística", objeto:"AQUISIÇÃO DE CAMINHÕES AUTO-BOMBA TANQUE E AUTO-PLATAFORMA MECÂNICA PARA RENOVAÇÃO DA FROTA DO CBMERJ.", etapa:"habilitacao", status:"em-disputa", responsaveis:[9,2], dataEnvio:"2026-05-21", cidade:"Rio de Janeiro", estado:"RJ", valorGlobal:24500000, itensMatch:2 },
  { id:"1432016", codigoEdital:"316/2026", titulo:"Mobiliário hospitalar — INTO", segmentos:["Saúde","Mobiliário"], orgao:"Instituto Nacional de Traumatologia e Ortopedia / Diretoria Administrativa", objeto:"AQUISIÇÃO DE MOBILIÁRIO HOSPITALAR, INCLUINDO LEITOS, MACAS E ARMÁRIOS, PARA OS CENTROS CIRÚRGICOS DO INTO.", etapa:"analise", status:"abertas", responsaveis:[10], dataEnvio:"2026-05-21", cidade:"Rio de Janeiro", estado:"RJ", valorGlobal:2740000, itensMatch:8 },
  { id:"1432017", codigoEdital:"317/2026", titulo:"VoIP corporativo — Câmara dos Deputados", segmentos:["TI","Tecnologia da Informação e Comunicação"], orgao:"Câmara dos Deputados / Diretoria de Tecnologia da Informação", objeto:"CONTRATAÇÃO DE SOLUÇÃO DE TELEFONIA IP CORPORATIVA, COM 4500 RAMAIS E INTEGRAÇÃO AOS SISTEMAS LEGADOS.", etapa:"preparacao", status:"abertas", responsaveis:[8,6], dataEnvio:"2026-05-21", cidade:"Brasília", estado:"DF", valorGlobal:5640000, itensMatch:3 },
  { id:"1432018", codigoEdital:"318/2026", titulo:"Manutenção de aeronaves offshore — Petrobras", segmentos:["Engenharia","Aeroportos"], orgao:"Petrobras / Logística Aérea", objeto:"CONTRATAÇÃO DE SERVIÇOS DE MANUTENÇÃO PROGRAMADA DE HELICÓPTEROS UTILIZADOS NO TRANSPORTE OFFSHORE DA BACIA DE CAMPOS.", etapa:"disputa", status:"em-disputa", responsaveis:[4,9], dataEnvio:"2026-05-21", cidade:"Macaé", estado:"RJ", valorGlobal:18900000, itensMatch:6 },
  { id:"1432019", codigoEdital:"319/2026", titulo:"Iluminação pública LED — Florianópolis", segmentos:["Engenharia","Infraestrutura"], orgao:"Prefeitura Municipal de Florianópolis / Secretaria de Obras", objeto:"SUBSTITUIÇÃO DE 14.000 PONTOS DE ILUMINAÇÃO PÚBLICA POR LUMINÁRIAS LED COM TELEGESTÃO INDIVIDUAL.", etapa:"analise", status:"abertas", responsaveis:[3,5], dataEnvio:"2026-05-21", cidade:"Florianópolis", estado:"SC", valorGlobal:21300000, itensMatch:4 },
  { id:"1432020", codigoEdital:"320/2026", titulo:"Telas de proteção — escolas ES", segmentos:["Educação","Materiais"], orgao:"Governo do Estado do Espírito Santo / Secretaria de Educação", objeto:"AQUISIÇÃO E INSTALAÇÃO DE TELAS DE PROTEÇÃO PARA QUADRAS POLIESPORTIVAS DAS ESCOLAS DA REDE ESTADUAL.", etapa:"analise", status:"abertas", responsaveis:[7], dataEnvio:"2026-05-21", cidade:"Vitória", estado:"ES", valorGlobal:1450000, itensMatch:1 }
];

function getStatusEdital(id) { return STATUS_EDITAL.find(s => s.id === id); }
function personById(id)      { return PESSOAS.find(p => p.id === id); }

// =====================================================================
// Itens com correspondência (principais matches do usuário).
// Usado em calendar chip + tabela como "assunto" filtrado pelo que o
// usuário do Settle vende — em vez de objeto comprimido genérico.
// =====================================================================
const MATCHED_ITEMS_BY_ID = {
  // 14 originais
  "1431011": ["Sinalização horizontal de pista", "Concretagem de pátio", "Iluminação aeroportuária"],
  "1430952": ["Limpeza hospitalar áreas críticas", "Insumos de higienização", "Coleta de resíduos"],
  "1430887": ["Arroz integral 1kg", "Feijão carioca", "Frango congelado", "Leite UHT"],
  "1430715": ["Solução EDR Endpoint", "Console de gestão", "Suporte técnico 24x7"],
  "1430660": ["Recapeamento asfáltico CBUQ", "Sinalização vertical", "Drenagem pluvial"],
  "1430501": ["Ônibus urbano Padron", "Acessibilidade PCD"],
  "1430340": ["Posto vigilância armada", "Equipamentos TETRA", "Uniformes operacionais"],
  "1430210": ["Ventilador pulmonar adulto", "Monitor multiparâmetro", "Bomba de infusão"],
  "1430105": ["Cadeira ergonômica giratória", "Mesa de trabalho 160cm", "Armário aço 4 prateleiras"],
  "1429988": ["Almoço escolar 250g", "Lanche da tarde", "Janta integral"],
  "1429820": ["Limpeza predial diária", "Asseio e conservação"],
  "1429401": ["Microsoft 365 E5", "Suporte premium"],
  "1429220": ["Veículo blindado custódia"],
  "1429110": ["Restauração de fachada histórica", "Pintura técnica patrimonial", "Recuperação de molduras"],

  // 20 novos (dataEnvio = today)
  "1432001": ["Oxigênio medicinal cilindro", "Óxido nitroso", "Ar comprimido medicinal"],
  "1432002": ["Camisa operacional", "Calça tática", "Colete balístico IIIA"],
  "1432003": ["Licença SIG acadêmico", "Módulo de matrícula"],
  "1432004": ["Almoço escolar pronto", "Lanche manhã", "Cardápio para alérgicos"],
  "1432005": ["Caminhão coletor compactador", "Manutenção preventiva"],
  "1432006": ["Transformador 138 kV", "Sistema de proteção", "Painel de controle"],
  "1432007": ["Pavimentação CBUQ", "Drenagem pluvial", "Calçamento de meio-fio"],
  "1432008": ["Carteira escolar individual", "Apoio dorsal ergonômico"],
  "1432009": ["Câmera CFTV 4K", "Sensor de tráfego", "Painel de mensagens variáveis"],
  "1432010": ["Manutenção de gerador", "Troca de óleo", "Bateria estacionária"],
  "1432011": ["Ultrassom fisioterápico", "Eletroestimulador TENS", "Mesa de Bobath"],
  "1432012": ["Reforma elétrica de delegacia", "Pintura interna", "Climatização split"],
  "1432013": ["Reagente PCR", "Pipeta automática", "Vidraria laboratorial"],
  "1432014": ["Vacina influenza", "Vacina hepatite B", "Vacina HPV"],
  "1432015": ["Auto-bomba tanque 8m³", "Plataforma mecânica 32m"],
  "1432016": ["Leito hospitalar elétrico", "Maca de transporte", "Armário inox"],
  "1432017": ["Telefone IP corporativo", "Headset USB", "Gateway VoIP"],
  "1432018": ["Inspeção 100h de helicóptero", "Troca de pás", "Manutenção avionics"],
  "1432019": ["Luminária LED 100W", "Sistema telegestão", "Braço galvanizado"],
  "1432020": ["Tela de proteção polietileno"]
};

// Resumo legível dos matches pra usar em views compactas.
// Mostra até `max` itens + contagem do restante.
function matchSummary(item, max = 2) {
  const items = MATCHED_ITEMS_BY_ID[item.id] || [];
  const total = item.itensMatch || 0;
  if (items.length === 0) return total ? `${total} itens com correspondência` : "—";
  const shown = items.slice(0, max);
  const rest  = total - shown.length;
  return rest > 0 ? `${shown.join(" · ")} (+${rest})` : shown.join(" · ");
}
