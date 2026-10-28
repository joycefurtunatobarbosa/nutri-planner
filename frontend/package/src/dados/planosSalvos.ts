import type { Alimento, FonteAlimento } from './alimentos';

export interface AlimentoNoPlano extends Alimento {
    quantidadeGramas: number;
}

export interface RefeicaoPlano {
    nome: string;
    horario?: string;
    alimentos: AlimentoNoPlano[];
}

export interface PlanoAlimentarSalvo {
    id: number;
    paciente: string;
    objetivo: string;
    calorias: number | null;
    refeicoes: number;
    atualizadoEm: string;
    status: 'Ativo' | 'Rascunho' | 'Concluído';
    itens: RefeicaoPlano[];
}

const CHAVE_PLANOS = 'nutriplanner:planos-alimentares';

export function lerPlanosSalvos(): PlanoAlimentarSalvo[] {
    const valorSalvo = localStorage.getItem(CHAVE_PLANOS);

    if (!valorSalvo) {
        return [];
    }

    const dados: unknown = JSON.parse(valorSalvo);

    if (!Array.isArray(dados)) {
        throw new Error('Os planos salvos estão em um formato inválido.');
    }

    return dados as PlanoAlimentarSalvo[];
}

export function salvarPlano(plano: PlanoAlimentarSalvo): void {
    const planos = lerPlanosSalvos();
    planos.unshift(plano);
    localStorage.setItem(CHAVE_PLANOS, JSON.stringify(planos));
}

export function atualizarPlano(planoAtualizado: PlanoAlimentarSalvo): void {
    const planos = lerPlanosSalvos();
    const indice = planos.findIndex((plano) => plano.id === planoAtualizado.id);

    if (indice === -1) {
        throw new Error('O plano que você tentou atualizar não foi encontrado.');
    }

    planos[indice] = planoAtualizado;
    localStorage.setItem(CHAVE_PLANOS, JSON.stringify(planos));
}

export function criarAlimentoPersonalizado(
    id: string,
    nome: string,
    nutrientes: Pick<Alimento, 'kcal' | 'proteina_g' | 'lipideos_g' | 'carboidrato_g' | 'fibra_g'>
): Alimento {
    const fonte: FonteAlimento = 'Personalizado';

    return {
        id,
        nome,
        grupo: 'Alimento personalizado',
        fonte,
        ...nutrientes
    };
}
