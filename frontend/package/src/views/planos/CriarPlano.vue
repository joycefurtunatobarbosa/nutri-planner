<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { alimentosBase, type Alimento, type FonteAlimento } from '@/dados/alimentos';
import { gerarCodigoHashPlano, obterPlanoMockPorCodigo } from '@/dados/planosMock';
import {
    atualizarPlano,
    criarAlimentoPersonalizado,
    lerPlanosSalvos,
    salvarPlano,
    type AlimentoNoPlano,
    type PlanoAlimentarSalvo,
    type RefeicaoPlano
} from '@/dados/planosSalvos';

const route = useRoute();
const router = useRouter();
const fontes: FonteAlimento[] = ['TACO', 'Tucunduva', 'Personalizado'];
const refeicoesPadrao = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia'];
const horariosPadrao = ['07:30', '10:00', '12:30', '16:00', '19:30', '21:30'];

function criarRefeicoesPadrao(): RefeicaoPlano[] {
    return refeicoesPadrao.map((nome, indice) => ({ nome, horario: horariosPadrao[indice], alimentos: [] }));
}

const refeicoes = ref<RefeicaoPlano[]>(criarRefeicoesPadrao());
const nomesRefeicoes = computed(() => refeicoes.value.map((refeicao) => refeicao.nome));
const refeicaoSelecionada = ref(refeicoesPadrao[0]);
const nomePaciente = ref('');
const objetivo = ref('');
const busca = ref('');
const filtroFonte = ref<FonteAlimento | 'Todas as fontes'>('Todas as fontes');
const quantidadeBusca = ref(100);
const dialogoPersonalizado = ref(false);
const dialogoNovaRefeicao = ref(false);
const nomeNovaRefeicao = ref('');
const horarioNovaRefeicao = ref('');
const erroNovaRefeicao = ref('');
const erroPersonalizado = ref('');
const erro = ref('');
const mensagem = ref('');
const notificacaoAberta = ref(false);
const salvando = ref(false);
const planoMockCarregado = ref(false);
const planoSalvoId = ref<number | null>(null);
const statusPlanoCarregado = ref<PlanoAlimentarSalvo['status']>('Rascunho');
const erroPlanoMock = ref('');

watch(
    () => route.params.codigo,
    (codigo) => {
        planoMockCarregado.value = false;
        planoSalvoId.value = null;
        statusPlanoCarregado.value = 'Rascunho';
        erroPlanoMock.value = '';

        if (codigo === undefined) {
            nomePaciente.value = '';
            objetivo.value = '';
            refeicoes.value = criarRefeicoesPadrao();
            refeicaoSelecionada.value = refeicoesPadrao[0];
            return;
        }

        if (typeof codigo !== 'string') {
            erroPlanoMock.value = 'O plano solicitado não foi encontrado.';
            return;
        }

        if (codigo.startsWith('m-')) {
            const plano = obterPlanoMockPorCodigo(codigo);

            if (!plano) {
                erroPlanoMock.value = 'O plano solicitado não foi encontrado.';
                return;
            }

            nomePaciente.value = plano.paciente;
            objetivo.value = plano.objetivo;
            statusPlanoCarregado.value = plano.status;
            refeicoes.value = plano.itens.map((refeicao) => ({
                ...refeicao,
                alimentos: refeicao.alimentos.map((alimento) => ({ ...alimento }))
            }));
            refeicaoSelecionada.value = refeicoes.value[0]?.nome ?? refeicoesPadrao[0];
            planoMockCarregado.value = true;
            return;
        }

        if (!codigo.startsWith('p-')) {
            erroPlanoMock.value = 'O plano solicitado não foi encontrado.';
            return;
        }

        try {
            const plano = lerPlanosSalvos().find(
                (item) => gerarCodigoHashPlano('salvo', item.id, item.paciente) === codigo
            );

            if (!plano) {
                erroPlanoMock.value = 'O plano solicitado não foi encontrado neste navegador.';
                return;
            }

            nomePaciente.value = plano.paciente;
            objetivo.value = plano.objetivo;
            statusPlanoCarregado.value = plano.status;
            refeicoes.value = plano.itens.map((refeicao) => ({
                ...refeicao,
                alimentos: refeicao.alimentos.map((alimento) => ({ ...alimento }))
            }));
            refeicaoSelecionada.value = refeicoes.value[0]?.nome ?? refeicoesPadrao[0];
            planoSalvoId.value = plano.id;
        } catch (falha) {
            console.error('Não foi possível carregar o plano salvo.', falha);
            erroPlanoMock.value = 'Não foi possível carregar o plano salvo neste navegador.';
        }
    },
    { immediate: true }
);

const novoAlimento = ref({
    nome: '',
    kcal: null as number | null,
    proteina: null as number | null,
    gordura: null as number | null,
    carboidrato: null as number | null,
    fibra: null as number | null
});

const alimentosCorrespondentes = computed(() => {
    const termo = busca.value.trim().toLocaleLowerCase('pt-BR');

    return alimentosBase.filter((alimento) => {
        const correspondeBusca =
            !termo ||
            alimento.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
            alimento.grupo?.toLocaleLowerCase('pt-BR').includes(termo);
        const correspondeFonte = filtroFonte.value === 'Todas as fontes' || alimento.fonte === filtroFonte.value;

        return correspondeBusca && correspondeFonte;
    });
});

const alimentosEncontrados = computed(() => alimentosCorrespondentes.value.slice(0, 20));
const todasAsPorcoes = computed(() =>
    refeicoes.value.reduce<AlimentoNoPlano[]>((porcoes, refeicao) => {
        porcoes.push(...refeicao.alimentos);
        return porcoes;
    }, [])
);

function calcularNutriente(
    porcoes: AlimentoNoPlano[],
    nutriente: 'kcal' | 'proteina_g' | 'carboidrato_g' | 'lipideos_g'
): number | null {
    if (porcoes.some((porcao) => porcao[nutriente] === null)) {
        return null;
    }

    return porcoes.reduce((total, porcao) => total + ((porcao[nutriente] ?? 0) * porcao.quantidadeGramas) / 100, 0);
}

const resumo = computed(() => ({
    proteina: calcularNutriente(todasAsPorcoes.value, 'proteina_g'),
    calorias: calcularNutriente(todasAsPorcoes.value, 'kcal'),
    carboidrato: calcularNutriente(todasAsPorcoes.value, 'carboidrato_g'),
    gordura: calcularNutriente(todasAsPorcoes.value, 'lipideos_g')
}));

function formatarNutriente(valor: number | null, unidade: string): string {
    return valor === null ? '—' : `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${unidade}`;
}

function adicionarAlimento(alimento: Alimento) {
    const porcao = refeicoes.value.find((refeicao) => refeicao.nome === refeicaoSelecionada.value);

    if (!porcao || quantidadeBusca.value <= 0) {
        erro.value = 'Informe uma quantidade em gramas maior que zero.';
        return;
    }

    const existente = porcao.alimentos.find((item) => item.id === alimento.id);

    if (existente) {
        existente.quantidadeGramas += quantidadeBusca.value;
    } else {
        porcao.alimentos.push({ ...alimento, quantidadeGramas: quantidadeBusca.value });
    }

    erro.value = '';
    mensagem.value = `${alimento.nome} adicionado a ${refeicaoSelecionada.value.toLocaleLowerCase('pt-BR')}.`;
    notificacaoAberta.value = true;
}

function removerAlimento(refeicao: RefeicaoPlano, alimentoId: string) {
    refeicao.alimentos = refeicao.alimentos.filter((alimento) => alimento.id !== alimentoId);
}

function atualizarQuantidade(alimento: AlimentoNoPlano, valor: string | number | null) {
    const quantidade = Number(valor);

    if (Number.isFinite(quantidade) && quantidade > 0) {
        alimento.quantidadeGramas = quantidade;
    }
}

function abrirAlimentoPersonalizado() {
    novoAlimento.value = { nome: '', kcal: null, proteina: null, gordura: null, carboidrato: null, fibra: null };
    erroPersonalizado.value = '';
    erro.value = '';
    dialogoPersonalizado.value = true;
}

function abrirNovaRefeicao() {
    nomeNovaRefeicao.value = '';
    horarioNovaRefeicao.value = '';
    erroNovaRefeicao.value = '';
    dialogoNovaRefeicao.value = true;
}

function adicionarRefeicaoPersonalizada() {
    const nome = nomeNovaRefeicao.value.trim();

    if (!nome) {
        erroNovaRefeicao.value = 'Informe o nome da refeição.';
        return;
    }

    const duplicada = refeicoes.value.some(
        (refeicao) => refeicao.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR')
    );

    if (duplicada) {
        erroNovaRefeicao.value = 'Já existe uma refeição com esse nome.';
        return;
    }

    refeicoes.value.push({ nome, horario: horarioNovaRefeicao.value || undefined, alimentos: [] });
    refeicaoSelecionada.value = nome;
    dialogoNovaRefeicao.value = false;
    erroNovaRefeicao.value = '';
    mensagem.value = `Refeição "${nome}" criada.`;
    notificacaoAberta.value = true;
}

function adicionarAlimentoPersonalizado() {
    const alimento = novoAlimento.value;
    const nutrientesObrigatorios = [alimento.kcal, alimento.proteina, alimento.gordura, alimento.carboidrato];

    if (!alimento.nome.trim() || nutrientesObrigatorios.some((valor) => valor === null || valor < 0)) {
        erroPersonalizado.value = 'Preencha o nome e os valores nutricionais obrigatórios por 100 g.';
        return;
    }

    if (alimento.fibra !== null && alimento.fibra < 0) {
        erroPersonalizado.value = 'O valor de fibras não pode ser negativo.';
        return;
    }

    if (quantidadeBusca.value <= 0) {
        erroPersonalizado.value = 'Informe uma quantidade em gramas maior que zero.';
        return;
    }

    adicionarAlimento(
        criarAlimentoPersonalizado(crypto.randomUUID(), alimento.nome.trim(), {
            kcal: alimento.kcal,
            proteina_g: alimento.proteina,
            lipideos_g: alimento.gordura,
            carboidrato_g: alimento.carboidrato,
            fibra_g: alimento.fibra
        })
    );
    erroPersonalizado.value = '';
    dialogoPersonalizado.value = false;
}

function salvarRascunho() {
    if (!nomePaciente.value.trim() || !objetivo.value.trim()) {
        erro.value = 'Informe o nome do paciente e o objetivo do plano.';
        return;
    }

    if (!todasAsPorcoes.value.length) {
        erro.value = 'Adicione ao menos um alimento antes de salvar o plano.';
        return;
    }

    salvando.value = true;
    erro.value = '';

    try {
        const plano: PlanoAlimentarSalvo = {
            id: planoSalvoId.value ?? Date.now(),
            paciente: nomePaciente.value.trim(),
            objetivo: objetivo.value.trim(),
            calorias: resumo.value.calorias === null ? null : Math.round(resumo.value.calorias),
            refeicoes: refeicoes.value.filter((refeicao) => refeicao.alimentos.length > 0).length,
            atualizadoEm: 'Hoje',
            status: planoSalvoId.value === null && !planoMockCarregado.value ? 'Rascunho' : statusPlanoCarregado.value,
            itens: refeicoes.value
        };

        if (planoSalvoId.value === null) {
            salvarPlano(plano);
        } else {
            atualizarPlano(plano);
        }

        void router.push('/planos-alimentares');
    } catch (falha) {
        console.error('Não foi possível salvar o plano alimentar.', falha);
        erro.value = 'Não foi possível salvar o plano neste navegador. Tente novamente.';
    } finally {
        salvando.value = false;
    }
}
</script>

<template>
    <main class="pagina-criar-plano">
        <div class="cabecalho-pagina">
            <div>
                <div class="caminho-pagina"><RouterLink to="/planos-alimentares">Planos alimentares</RouterLink><span>/</span>{{ planoMockCarregado || planoSalvoId ? 'Abrir plano' : 'Novo plano' }}</div>
                <h1>{{ planoMockCarregado ? 'Abrir plano alimentar' : planoSalvoId ? 'Editar plano alimentar' : 'Criar plano alimentar' }}</h1>
                <p class="texto-introdutorio">
                    {{ planoMockCarregado ? 'Plano carregado com dados demonstrativos para visualização e edição.' : planoSalvoId ? 'Atualize os dados e as refeições deste plano alimentar.' : 'Monte as refeições e acompanhe os valores nutricionais de cada alimento.' }}
                </p>
            </div>
            <div class="acoes-cabecalho">
                <v-btn variant="outlined" class="texto-botao" to="/planos-alimentares">Cancelar</v-btn>
                <v-btn variant="outlined" class="texto-botao">
                    <Icon icon="solar:printer-linear" width="18" class="me-2" />
                    Gerar PDF
                </v-btn>
                <v-btn color="primary" :loading="salvando" @click="salvarRascunho">
                    <Icon icon="solar:diskette-linear" width="18" class="me-2" />
                    {{ planoMockCarregado || planoSalvoId ? 'Salvar alterações' : 'Salvar rascunho' }}
                </v-btn>
            </div>
        </div>

        <v-alert v-if="erro" type="error" variant="tonal" closable class="mb-5" @click:close="erro = ''">
            {{ erro }}
        </v-alert>
        <v-alert v-if="erroPlanoMock" type="error" variant="tonal" class="mb-5">
            {{ erroPlanoMock }}
        </v-alert>

        <section class="cartoes-nutricao" aria-label="Resumo nutricional">
            <v-card class="cartao-nutricao energia" elevation="0">
                <span>Calorias</span><strong>{{ formatarNutriente(resumo.calorias, 'kcal') }}</strong>
                <small>no plano</small>
            </v-card>
            <v-card class="cartao-nutricao carboidrato" elevation="0">
                <span>Carboidratos</span><strong>{{ formatarNutriente(resumo.carboidrato, 'g') }}</strong>
                <small>no plano</small>
            </v-card>
            <v-card class="cartao-nutricao proteina" elevation="0">
                <span>Proteínas</span><strong>{{ formatarNutriente(resumo.proteina, 'g') }}</strong>
                <small>no plano</small>
            </v-card>
            <v-card class="cartao-nutricao gordura" elevation="0">
                <span>Gorduras</span><strong>{{ formatarNutriente(resumo.gordura, 'g') }}</strong>
                <small>no plano</small>
            </v-card>
        </section>
        <p v-if="todasAsPorcoes.some((alimento) => alimento.kcal === null || alimento.proteina_g === null || alimento.carboidrato_g === null || alimento.lipideos_g === null)" class="aviso-dados">
            Alguns alimentos não têm todos os nutrientes informados na fonte; o total correspondente será exibido como “—”.
        </p>

        <v-row class="mt-1">
            <v-col cols="12" lg="6">
                <v-card class="cartao-conteudo" elevation="0">
                    <div class="titulo-secao">
                        <div class="icone-secao"><Icon icon="solar:user-id-linear" width="21" /></div>
                        <div><h2>Dados do plano</h2><p>Identifique o paciente e o objetivo</p></div>
                    </div>
                    <v-text-field v-model="nomePaciente" label="Paciente" placeholder="Nome completo" variant="outlined" />
                    <v-text-field v-model="objetivo" label="Objetivo nutricional" placeholder="Ex.: Reeducação alimentar" variant="outlined" />

                    <v-divider class="my-4" />

                    <div class="titulo-secao titulo-busca">
                        <div class="icone-secao verde"><Icon icon="solar:magnifer-linear" width="21" /></div>
                        <div><h2>Adicionar alimentos</h2><p>Busque nas tabelas ou crie um alimento</p></div>
                    </div>

                    <v-text-field
                        v-model="busca"
                        label="Buscar alimento"
                        placeholder="Ex.: arroz, frango, banana..."
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        clearable
                        hide-details
                        class="mb-4"
                    />
                    <div class="linha-filtros">
                        <v-select v-model="filtroFonte" :items="['Todas as fontes', ...fontes]" label="Fonte dos dados" variant="outlined" hide-details />
                        <v-text-field v-model.number="quantidadeBusca" label="Porção" type="number" min="1" suffix="g" variant="outlined" hide-details />
                    </div>
                    <v-select v-model="refeicaoSelecionada" :items="nomesRefeicoes" label="Adicionar à refeição" variant="outlined" class="mt-4" />

                    <v-btn variant="tonal" color="primary" block class="mb-4 texto-botao" @click="abrirAlimentoPersonalizado">
                        <Icon icon="solar:add-circle-linear" width="18" class="me-2" />
                        Criar alimento personalizado
                    </v-btn>

                    <div class="cabecalho-resultados">
                        <strong>{{ busca.trim() ? 'Resultados da busca' : 'Alimentos disponíveis' }}</strong>
                        <span>
                            {{ alimentosEncontrados.length === alimentosCorrespondentes.length
                                ? `${alimentosCorrespondentes.length} resultados`
                                : `${alimentosEncontrados.length} de ${alimentosCorrespondentes.length} resultados` }}
                        </span>
                    </div>
                    <div v-if="alimentosEncontrados.length" class="lista-alimentos">
                        <article v-for="alimento in alimentosEncontrados" :key="alimento.id" class="item-alimento">
                            <div class="alimento-cabecalho">
                                <div class="alimento-nome">
                                    <strong>{{ alimento.nome }}</strong>
                                    <span>{{ alimento.grupo || 'Grupo não informado' }}</span>
                                </div>
                                <v-chip size="x-small" variant="tonal" :color="alimento.fonte === 'TACO' ? 'primary' : alimento.fonte === 'Tucunduva' ? 'success' : 'warning'">
                                    {{ alimento.fonte }}
                                </v-chip>
                            </div>
                            <div class="nutrientes-alimento">
                                <span><b>{{ formatarNutriente(alimento.kcal, 'kcal') }}</b> energia</span>
                                <span><b>{{ formatarNutriente(alimento.carboidrato_g, 'g') }}</b> carb.</span>
                                <span><b>{{ formatarNutriente(alimento.proteina_g, 'g') }}</b> prot.</span>
                                <span><b>{{ formatarNutriente(alimento.lipideos_g, 'g') }}</b> gordura</span>
                            </div>
                            <div class="rodape-alimento">
                                <span>Valores por 100 g</span>
                                <v-btn size="small" variant="text" color="primary" @click="adicionarAlimento(alimento)">
                                    <Icon icon="solar:add-circle-linear" width="17" class="me-1" /> Adicionar
                                </v-btn>
                            </div>
                        </article>
                    </div>
                    <div v-else class="sem-resultados">
                        <Icon icon="solar:magnifer-linear" width="25" />
                        <strong>Nenhum alimento encontrado</strong>
                        <span>Confira a busca ou selecione outra fonte.</span>
                    </div>
                    <p class="nota-fontes">Fontes: Tabela TACO e Tabela de Composição Química dos Alimentos de Tucunduva. Valores por 100 g.</p>
                </v-card>
            </v-col>

            <v-col cols="12" lg="6">
                <v-card class="cartao-conteudo cartao-refeicoes" elevation="0">
                    <div class="cabecalho-refeicoes-plano">
                        <div class="titulo-secao">
                            <div class="icone-secao laranja"><Icon icon="solar:clipboard-list-linear" width="21" /></div>
                            <div><h2>Refeições do plano</h2><p>As quantidades podem ser ajustadas em gramas</p></div>
                        </div>
                        <v-btn variant="tonal" color="primary" class="texto-botao" @click="abrirNovaRefeicao">
                            <Icon icon="solar:add-circle-linear" width="18" class="me-1" />
                            Nova refeição
                        </v-btn>
                    </div>
                    <div v-for="refeicao in refeicoes" :key="refeicao.nome" class="bloco-refeicao">
                        <div class="cabecalho-refeicao">
                            <div><h3>{{ refeicao.nome }}</h3><span>{{ refeicao.alimentos.length }} {{ refeicao.alimentos.length === 1 ? 'alimento' : 'alimentos' }}</span></div>
                            <input
                                v-model="refeicao.horario"
                                type="time"
                                class="campo-horario"
                                :aria-label="`Horário de ${refeicao.nome}`"
                            />
                            <v-btn
                                size="small"
                                variant="text"
                                color="primary"
                                class="texto-botao"
                                @click="refeicaoSelecionada = refeicao.nome"
                            >
                                <Icon icon="solar:add-circle-linear" width="17" class="me-1" /> Adicionar
                            </v-btn>
                        </div>
                        <div v-if="refeicao.alimentos.length" class="itens-refeicao">
                            <div v-for="alimento in refeicao.alimentos" :key="alimento.id" class="linha-refeicao">
                                <div class="detalhe-refeicao">
                                    <strong>{{ alimento.nome }}</strong>
                                    <v-chip size="x-small" variant="tonal" :color="alimento.fonte === 'TACO' ? 'primary' : alimento.fonte === 'Tucunduva' ? 'success' : 'warning'">
                                        {{ alimento.fonte }}
                                    </v-chip>
                                    <div class="nutrientes-item-refeicao">
                                        <span>{{ formatarNutriente(alimento.kcal === null ? null : alimento.kcal * alimento.quantidadeGramas / 100, 'kcal') }}</span>
                                        <span>{{ formatarNutriente(alimento.carboidrato_g === null ? null : alimento.carboidrato_g * alimento.quantidadeGramas / 100, 'g') }} carb.</span>
                                        <span>{{ formatarNutriente(alimento.proteina_g === null ? null : alimento.proteina_g * alimento.quantidadeGramas / 100, 'g') }} prot.</span>
                                        <span>{{ formatarNutriente(alimento.lipideos_g === null ? null : alimento.lipideos_g * alimento.quantidadeGramas / 100, 'g') }} gord.</span>
                                    </div>
                                </div>
                                <v-text-field
                                    :model-value="alimento.quantidadeGramas"
                                    aria-label="Quantidade em gramas"
                                    type="number"
                                    min="1"
                                    suffix="g"
                                    density="compact"
                                    variant="outlined"
                                    hide-details
                                    class="campo-gramas"
                                    @update:model-value="atualizarQuantidade(alimento, $event)"
                                />
                                <v-btn icon variant="text" color="error" size="small" :aria-label="`Remover ${alimento.nome}`" @click="removerAlimento(refeicao, alimento.id)">
                                    <Icon icon="solar:trash-bin-minimalistic-linear" width="18" />
                                </v-btn>
                            </div>
                        </div>
                        <div v-else class="refeicao-vazia">
                            <span>Nenhum alimento adicionado</span>
                            <v-btn size="small" variant="text" color="primary" class="texto-botao" @click="refeicaoSelecionada = refeicao.nome">
                                Escolher alimentos
                            </v-btn>
                        </div>
                    </div>
                    <div class="nota-total">
                        <Icon icon="solar:info-circle-linear" width="17" />
                        Os valores nutricionais são calculados proporcionalmente à quantidade em gramas e podem variar conforme a fonte.
                    </div>
                </v-card>
            </v-col>
        </v-row>

        <v-dialog v-model="dialogoPersonalizado" max-width="560">
            <v-card class="dialogo-personalizado">
                <v-card-title>Criar alimento personalizado</v-card-title>
                <v-card-text>
                    <p class="texto-dialogo">Informe os valores nutricionais por 100 g. O alimento será identificado como Personalizado neste plano.</p>
                    <v-alert v-if="erroPersonalizado" type="error" variant="tonal" class="mb-4">{{ erroPersonalizado }}</v-alert>
                    <v-text-field v-model="novoAlimento.nome" label="Nome do alimento" placeholder="Ex.: Panqueca de aveia" variant="outlined" class="mb-2" />
                    <div class="grade-nutrientes">
                        <v-text-field v-model.number="novoAlimento.kcal" label="Calorias" suffix="kcal" type="number" min="0" variant="outlined" />
                        <v-text-field v-model.number="novoAlimento.proteina" label="Proteínas" suffix="g" type="number" min="0" variant="outlined" />
                        <v-text-field v-model.number="novoAlimento.carboidrato" label="Carboidratos" suffix="g" type="number" min="0" variant="outlined" />
                        <v-text-field v-model.number="novoAlimento.gordura" label="Gorduras" suffix="g" type="number" min="0" variant="outlined" />
                    </div>
                    <v-text-field v-model.number="novoAlimento.fibra" label="Fibras (opcional)" suffix="g" type="number" min="0" variant="outlined" />
                </v-card-text>
                <v-card-actions class="px-6 pb-6">
                    <v-spacer />
                    <v-btn variant="text" class="texto-botao" @click="dialogoPersonalizado = false">Cancelar</v-btn>
                    <v-btn color="primary" @click="adicionarAlimentoPersonalizado">Adicionar ao plano</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="dialogoNovaRefeicao" max-width="440">
            <v-card class="dialogo-personalizado">
                <v-card-title>Nova refeição</v-card-title>
                <v-card-text>
                    <p class="texto-dialogo">Crie uma refeição personalizada para este plano.</p>
                    <v-alert v-if="erroNovaRefeicao" type="error" variant="tonal" class="mb-4">{{ erroNovaRefeicao }}</v-alert>
                    <v-text-field
                        v-model="nomeNovaRefeicao"
                        label="Nome da refeição"
                        placeholder="Ex.: Pré-treino"
                        variant="outlined"
                        autofocus
                        @keyup.enter="adicionarRefeicaoPersonalizada"
                    />
                    <v-text-field v-model="horarioNovaRefeicao" label="Horário" type="time" variant="outlined" />
                </v-card-text>
                <v-card-actions class="px-6 pb-6">
                    <v-spacer />
                    <v-btn variant="text" class="texto-botao" @click="dialogoNovaRefeicao = false">Cancelar</v-btn>
                    <v-btn color="primary" @click="adicionarRefeicaoPersonalizada">Criar refeição</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-snackbar v-model="notificacaoAberta" color="success" timeout="2500">{{ mensagem }}</v-snackbar>
    </main>
</template>

<style scoped lang="scss">
.pagina-criar-plano { color: #0a2540; }
.cabecalho-pagina { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.cabecalho-pagina h1 { margin: 10px 0 6px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
.caminho-pagina { color: #7b8893; font-size: 13px; }
.caminho-pagina a { color: #635bff; text-decoration: none; }
.caminho-pagina span { margin: 0 8px; color: #b6c0c8; }
.texto-introdutorio, .titulo-secao p, .cartao-nutricao small { margin: 0; color: #7b8893; font-size: 13px; }
.acoes-cabecalho { display: flex; gap: 10px; }
.texto-botao { text-transform: none; }
.cartoes-nutricao { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.cartao-nutricao { display: flex; min-height: 108px; flex-direction: column; justify-content: center; gap: 3px; padding: 16px 20px; border: 1px solid #e8edf2; border-radius: 12px; }
.cartao-nutricao span { color: #647282; font-size: 13px; }
.cartao-nutricao strong { color: #0a2540; font-size: 21px; font-weight: 700; }
.cartao-nutricao.proteina { border-left: 3px solid #28a66a; }
.cartao-nutricao.energia { border-left: 3px solid #635bff; }
.cartao-nutricao.carboidrato { border-left: 3px solid #e39b25; }
.cartao-nutricao.gordura { border-left: 3px solid #e66c83; }
.aviso-dados { margin: 10px 0 0; color: #977019; font-size: 12px; }
.cartao-conteudo { height: 100%; padding: 22px; border: 1px solid #e8edf2; border-radius: 12px; }
.titulo-secao { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.titulo-secao h2 { margin: 0 0 4px; font-size: 17px; font-weight: 700; }
.icone-secao { display: grid; width: 42px; height: 42px; flex-shrink: 0; place-items: center; border-radius: 11px; color: #635bff; background: #f0efff; }
.icone-secao.verde { color: #218653; background: #eaf8f0; }
.icone-secao.laranja { color: #d89614; background: #fff7e5; }
.titulo-busca { margin-bottom: 16px; }
.linha-filtros { display: grid; grid-template-columns: 1fr 120px; gap: 12px; }
.cabecalho-resultados { display: flex; justify-content: space-between; margin: 18px 0 10px; color: #647282; font-size: 12px; }
.cabecalho-resultados strong { color: #0a2540; }
.lista-alimentos { display: flex; max-height: 570px; flex-direction: column; gap: 9px; overflow-y: auto; padding-right: 3px; }
.item-alimento { padding: 12px; border: 1px solid #edf0f4; border-radius: 10px; }
.alimento-cabecalho, .rodape-alimento { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.alimento-nome { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.alimento-nome strong { color: #0a2540; font-size: 13px; font-weight: 600; }
.alimento-nome span, .rodape-alimento > span { color: #8995a1; font-size: 11px; }
.nutrientes-alimento { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin: 12px 0 5px; color: #7b8893; font-size: 10px; }
.nutrientes-alimento b { display: block; color: #34495c; font-size: 11px; font-weight: 600; white-space: nowrap; }
.rodape-alimento { align-items: center; border-top: 1px solid #f0f2f5; padding-top: 5px; }
.nota-fontes { margin: 14px 0 0; color: #8995a1; font-size: 11px; line-height: 1.5; }
.sem-resultados { display: flex; min-height: 150px; flex-direction: column; align-items: center; justify-content: center; gap: 7px; color: #8995a1; text-align: center; }
.sem-resultados strong { color: #34495c; font-size: 14px; }
.sem-resultados span { font-size: 12px; }
.cartao-refeicoes { padding-bottom: 18px; }
.cabecalho-refeicoes-plano { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.cabecalho-refeicoes-plano .titulo-secao { min-width: 0; }
.bloco-refeicao { border: 1px solid #edf0f4; border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
.cabecalho-refeicao { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; background: #fafbfd; }
.campo-horario { margin-left: auto; margin-right: 8px; padding: 4px 8px; border: 1px solid #dfe5ec; border-radius: 6px; color: #0a2540; font-size: 13px; background: #fff; }
.cabecalho-refeicao h3 { margin: 0 0 3px; font-size: 14px; font-weight: 700; }
.cabecalho-refeicao span { color: #8995a1; font-size: 11px; }
.refeicao-vazia { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 14px; color: #8995a1; font-size: 12px; }
.itens-refeicao { padding: 0 14px; }
.linha-refeicao { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-top: 1px solid #f0f2f5; }
.detalhe-refeicao { display: flex; min-width: 0; flex: 1; flex-wrap: wrap; align-items: center; gap: 5px 8px; }
.detalhe-refeicao strong { width: 100%; overflow: hidden; color: #34495c; font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.nutrientes-item-refeicao { display: flex; flex-wrap: wrap; gap: 4px 8px; }
.nutrientes-item-refeicao span { color: #7b8893; font-size: 10px; }
.campo-gramas { width: 120px; min-width: 120px; flex: 0 0 120px; }
.nota-total { display: flex; align-items: flex-start; gap: 8px; margin: 16px 0 0; color: #7b8893; font-size: 11px; line-height: 1.5; }
.nota-total :deep(svg) { flex-shrink: 0; color: #635bff; }
.dialogo-personalizado { border-radius: 14px; }
.dialogo-personalizado .v-card-title { padding: 24px 24px 8px; font-size: 20px; font-weight: 700; }
.dialogo-personalizado .v-card-text { padding: 8px 24px 0; }
.texto-dialogo { margin: 0 0 18px; color: #7b8893; font-size: 13px; }
.grade-nutrientes { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
@media (max-width: 800px) {
    .cabecalho-pagina { align-items: flex-start; flex-direction: column; }
    .acoes-cabecalho { width: 100%; }
    .acoes-cabecalho :deep(.v-btn) { flex: 1; }
    .cabecalho-refeicoes-plano { align-items: flex-start; flex-direction: column; }
    .cartoes-nutricao { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
    .cartao-nutricao { min-height: 96px; padding: 13px; }
}
@media (max-width: 480px) {
    .cartao-conteudo { padding: 16px; }
    .nutrientes-alimento { grid-template-columns: repeat(2, 1fr); row-gap: 8px; }
    .linha-filtros { grid-template-columns: 1fr; }
    .cabecalho-pagina h1 { font-size: 24px; }
}
</style>
