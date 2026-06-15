// ==========================================================================
// CORE JAVASCRIPT - LOGICA DO DASHBOARD CRIPTOGRAFADO
// ==========================================================================

let dadosEstoqueGlobal = [];
let payloadCriptografado = null;
let chartInstancia = null;

// Dados de demonstração (caso dados.json ainda não exista)
const DADOS_TESTE = [
    {"Código": 10010, "Denominação": "ÁLCOOL ETÍLICO 70% 1L", "Unid. Medida": "FRASCO", "Saldo": 1250, "Preço*": 8.50, "Total": 10625.00, "Unidade": "ALMOXARIFADO CENTRAL SESAP"},
    {"Código": 10020, "Denominação": "SERINGA DESCARTÁVEL 10ML C/ AGULHA", "Unid. Medida": "UNIDADE", "Saldo": 24000, "Preço*": 0.45, "Total": 10800.00, "Unidade": "ALMOXARIFADO CENTRAL SESAP"},
    {"Código": 10030, "Denominação": "MÁSCARA CIRÚRGICA DESCARTÁVEL DUPLA", "Unid. Medida": "CAIXA", "Saldo": 0, "Preço*": 15.00, "Total": 0.00, "Unidade": "ALMOXARIFADO CENTRAL SESAP"},
    {"Código": 10010, "Denominação": "ÁLCOOL ETÍLICO 70% 1L", "Unid. Medida": "FRASCO", "Saldo": 450, "Preço*": 8.50, "Total": 3825.00, "Unidade": "HOSPITAL REGIONAL DE CAICÓ"},
    {"Código": 10020, "Denominação": "SERINGA DESCARTÁVEL 10ML C/ AGULHA", "Unid. Medida": "UNIDADE", "Saldo": 1200, "Preço*": 0.45, "Total": 540.00, "Unidade": "HOSPITAL REGIONAL DE CAICÓ"},
    {"Código": 10040, "Denominação": "AGULHA DESCARTÁVEL 25X7", "Unid. Medida": "UNIDADE", "Saldo": 8000, "Preço*": 0.15, "Total": 1200.00, "Unidade": "HOSPITAL REGIONAL DE CAICÓ"},
    {"Código": 10050, "Denominação": "LUVAS DE PROCEDIMENTO LÁTEX P", "Unid. Medida": "CAIXA", "Saldo": 8, "Preço*": 32.00, "Total": 256.00, "Unidade": "FARMACIA INTEGRADA SESAP"},
    {"Código": 10030, "Denominação": "MÁSCARA CIRÚRGICA DESCARTÁVEL DUPLA", "Unid. Medida": "CAIXA", "Saldo": 150, "Preço*": 15.00, "Total": 2250.00, "Unidade": "FARMACIA INTEGRADA SESAP"},
    {"Código": 10060, "Denominação": "DIPIRONA SÓDICA 500MG/ML INJ 2ML", "Unid. Medida": "AMPOLA", "Saldo": 0, "Preço*": 1.25, "Total": 0.00, "Unidade": "HOSPITAL SANTA CATARINA"},
    {"Código": 10070, "Denominação": "SORO FISIOLÓGICO 0,9% 500ML", "Unid. Medida": "FRASCO", "Saldo": 1800, "Preço*": 4.10, "Total": 7380.00, "Unidade": "HOSPITAL SANTA CATARINA"},
    {"Código": 10080, "Denominação": "PARACETAMOL 500MG COMPRIMIDO", "Unid. Medida": "COMPRIMIDO", "Saldo": 32000, "Preço*": 0.08, "Total": 2560.00, "Unidade": "HOSPITAL REGIONAL DE MOSSORÓ"},
    {"Código": 10070, "Denominação": "SORO FISIOLÓGICO 0,9% 500ML", "Unid. Medida": "FRASCO", "Saldo": 500, "Preço*": 4.10, "Total": 2050.00, "Unidade": "HOSPITAL REGIONAL DE MOSSORÓ"},
    {"Código": 10030, "Denominação": "MÁSCARA CIRÚRGICA DESCARTÁVEL DUPLA", "Unid. Medida": "CAIXA", "Saldo": 5, "Preço*": 15.00, "Total": 75.00, "Unidade": "HOSPITAL REGIONAL DE MOSSORÓ"}
];

// Carregar o JSON criptografado assim que a página abre
window.addEventListener('DOMContentLoaded', () => {
    carregarPayload();
});

// Busca o arquivo dados.json criptografado do servidor
function carregarPayload() {
    fetch('dados.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("Arquivo dados.json não encontrado.");
            }
            return response.json();
        })
        .then(data => {
            payloadCriptografado = data;
            console.log("Arquivo dados.json carregado com sucesso!");
        })
        .catch(error => {
            console.warn("Aviso: Não foi possível ler dados.json.", error);
            mostrarAvisoAmbienteTeste();
        });
}

// Caso dados.json falhe ou não exista (local de desenvolvimento)
function mostrarAvisoAmbienteTeste() {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.innerHTML = `
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--warning); color: var(--warning); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 15px; font-size: 0.85rem;">
            <i class="fa-solid fa-triangle-exclamation"></i> Arquivo <strong>dados.json</strong> não gerado ou erro de CORS local. 
            Você pode testar o layout inserindo a senha: <strong>teste</strong>.
        </div>
    `;
}

// Tenta decodificar o arquivo dados.json usando a senha inserida
function tentarAcesso() {
    const passwordInput = document.getElementById('dashboard-password');
    const senha = passwordInput.value.trim();
    const errorMsg = document.getElementById('error-msg');
    
    errorMsg.textContent = "Descriptografando dados...";

    // Caso de uso: Testar o Dashboard com dados locais (mock)
    if (!payloadCriptografado && senha === 'teste') {
        setTimeout(() => {
            dadosEstoqueGlobal = DADOS_TESTE;
            inicializarDashboard("Modo Demonstração (Dados Fictícios)");
        }, 500);
        return;
    }

    if (!payloadCriptografado) {
        errorMsg.textContent = "Erro: Arquivo dados.json não pôde ser carregado do servidor.";
        return;
    }

    // Processamento assíncrono para liberar a UI
    setTimeout(() => {
        try {
            const dadosDecodificados = descriptografarAES(payloadCriptografado, senha);
            
            if (!dadosDecodificados) {
                throw new Error("Falha na decodificação.");
            }

            dadosEstoqueGlobal = JSON.parse(dadosDecodificados);
            
            if (!Array.isArray(dadosEstoqueGlobal)) {
                throw new Error("Estrutura JSON incorreta.");
            }

            inicializarDashboard("Modo Produção (Dados Reais)");
        } catch (e) {
            console.error("Erro de Descriptografia:", e);
            errorMsg.innerHTML = `<span style="color: var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Senha incorreta ou dados corrompidos.</span>`;
        }
    }, 200);
}

// Descriptografia compatível com o PBKDF2 + AES-256-CBC do Python
function descriptografarAES(payload, password) {
    try {
        const salt = CryptoJS.enc.Base64.parse(payload.salt);
        const iv = CryptoJS.enc.Base64.parse(payload.iv);
        const ciphertext = CryptoJS.enc.Base64.parse(payload.ciphertext);
        
        // Deriva a chave usando a mesma lógica do Python PBKDF2
        const key = CryptoJS.PBKDF2(password, salt, {
            keySize: 256/32,
            iterations: 1000
        });
        
        // Decodifica usando AES-256-CBC
        const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: ciphertext },
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return null;
    }
}

// Inicializa a interface gráfica do Dashboard
function inicializarDashboard(modoText) {
    // Alterna a visualização das telas
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';

    console.log("Dashboard Inicializado com sucesso no:", modoText);

    // Preenche o dropdown de unidades
    preencherFiltroUnidades();
    
    // Renderiza os dados iniciais
    aplicarFiltros();
}

// Pega todas as unidades únicas do JSON e coloca no seletor
function preencherFiltroUnidades() {
    const select = document.getElementById('filter-unidade');
    
    // Limpar opções existentes (mantendo apenas 'TODAS')
    select.innerHTML = '<option value="TODAS">Todas as Unidades</option>';
    
    // Obter unidades únicas
    const unidades = [...new Set(dadosEstoqueGlobal.map(item => item.Unidade))].filter(Boolean).sort();
    
    unidades.forEach(unidade => {
        const option = document.createElement('option');
        option.value = unidade;
        option.textContent = unidade;
        select.appendChild(option);
    });
}

// Filtra a lista global em memória com base nos inputs do usuário e redesenha a tela
function aplicarFiltros() {
    const filtroUnidade = document.getElementById('filter-unidade').value;
    const buscaTexto = document.getElementById('search-material').value.toLowerCase().trim();
    const filtroZerados = document.getElementById('filter-zerados').checked;

    // Filtra dados em memória
    let dadosFiltrados = dadosEstoqueGlobal.filter(item => {
        // Filtro por Unidade
        const matchUnidade = (filtroUnidade === 'TODAS' || item.Unidade === filtroUnidade);
        
        // Filtro de Busca por Texto (Código ou Descrição)
        const descMatch = (item.Denominação || '').toLowerCase().includes(buscaTexto);
        const codMatch = String(item.Código || '').includes(buscaTexto);
        const matchTexto = descMatch || codMatch;
        
        // Filtro de Estoque Crítico (Saldo <= 10 unidades ou Zerado)
        // Destaque para saldo zerado
        const matchZerados = !filtroZerados || (item.Saldo <= 10);

        return matchUnidade && matchTexto && matchZerados;
    });

    // Atualiza KPIs
    calcularKPIs(dadosFiltrados);

    // Atualiza Gráficos (mostra distribuição por unidade baseado no filtro selecionado)
    atualizarGraficoUnidades(dadosFiltrados);

    // Atualiza Tabela
    atualizarTabela(dadosFiltrados);
}

// Faz os somatórios das métricas exibidas nos cards superiores
function calcularKPIs(dados) {
    let valorTotal = 0;
    let totalItensUnicos = new Set();
    let itensCriticos = 0;

    dados.forEach(item => {
        valorTotal += parseFloat(item.Total) || 0;
        if (item.Código) {
            totalItensUnicos.add(item.Código);
        }
        if (parseFloat(item.Saldo) <= 10) {
            itensCriticos++;
        }
    });

    // Formatação BRL
    document.getElementById('kpi-total-valor').textContent = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('kpi-total-itens').textContent = totalItensUnicos.size;
    document.getElementById('kpi-itens-zerados').textContent = itensCriticos;
}

// Renderiza a lista na tabela HTML
function atualizarTabela(dados) {
    const tableBody = document.getElementById('table-body');
    const countBadge = document.getElementById('results-count');
    
    tableBody.innerHTML = '';
    countBadge.textContent = `${dados.length} item(ns) encontrado(s)`;

    if (dados.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhum material encontrado com os filtros aplicados.</td></tr>`;
        return;
    }

    dados.forEach(item => {
        const row = document.createElement('tr');
        const saldo = parseFloat(item.Saldo) || 0;
        
        // Linha crítica se o estoque for menor ou igual a 10
        if (saldo <= 10) {
            row.className = 'row-critical';
        } else {
            row.className = 'row-normal';
        }

        const precoUnitario = parseFloat(item['Preço*']) || 0;
        const total = parseFloat(item.Total) || 0;

        row.innerHTML = `
            <td>${item.Código || '-'}</td>
            <td><strong>${item.Denominação || '-'}</strong></td>
            <td>${item['Unid. Medida'] || '-'}</td>
            <td><span style="font-size: 0.85rem; color: var(--text-muted);">${item.Unidade || '-'}</span></td>
            <td>${saldo.toLocaleString('pt-BR')}</td>
            <td>${precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td class="td-val-total">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Consolida e desenha o gráfico de barras dos valores por unidade
function atualizarGraficoUnidades(dados) {
    // 1. Agrupar total por unidade
    let dadosAgrupados = {};
    dados.forEach(item => {
        const unidade = item.Unidade || 'NÃO DEFINIDA';
        dadosAgrupados[unidade] = (dadosAgrupados[unidade] || 0) + (parseFloat(item.Total) || 0);
    });

    // 2. Transformar em array e ordernar por valor decrescente
    let listaOrdenada = Object.keys(dadosAgrupados).map(unidade => {
        return { name: unidade, value: parseFloat(dadosAgrupados[unidade].toFixed(2)) };
    }).sort((a, b) => b.value - a.value);

    // Limitar em até 10 unidades para não poluir o gráfico
    const topUnidades = listaOrdenada.slice(0, 10);

    const categorias = topUnidades.map(item => item.name);
    const seriesValores = topUnidades.map(item => item.value);

    // Configuração do ApexCharts
    const options = {
        series: [{
            name: 'Valor em Estoque',
            data: seriesValores
        }],
        chart: {
            type: 'bar',
            height: 350,
            background: 'transparent',
            foreColor: '#94a3b8',
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                barHeight: '65%',
                distributed: true
            }
        },
        colors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#6366f1', '#a855f7'],
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
            },
            style: {
                colors: ['#fff'],
                fontFamily: 'Outfit, sans-serif'
            }
        },
        xaxis: {
            categories: categorias,
            labels: {
                formatter: function (val) {
                    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
                }
            }
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.05)'
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function (val) {
                    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                }
            }
        },
        legend: {
            show: false
        }
    };

    // Destrói instância antiga para recriar
    if (chartInstancia) {
        chartInstancia.destroy();
    }

    const container = document.querySelector("#chart-unidades");
    if (container) {
        chartInstancia = new ApexCharts(container, options);
        chartInstancia.render();
    }
}

// Função para sair do dashboard e apagar credenciais da memória
function sair() {
    dadosEstoqueGlobal = [];
    document.getElementById('dashboard-password').value = '';
    document.getElementById('error-msg').innerHTML = '';
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'flex';
}
