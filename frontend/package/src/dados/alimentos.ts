import tabelaTaco from '@/data/alimentos/taco.json';
import tabelaTucunduva from '@/data/alimentos/tucunduva.json';

export type FonteAlimento = 'TACO' | 'Tucunduva' | 'Personalizado';

export interface Alimento {
    id: string;
    nome: string;
    grupo: string | null;
    fonte: FonteAlimento;
    kcal: number | null;
    proteina_g: number | null;
    lipideos_g: number | null;
    carboidrato_g: number | null;
    fibra_g: number | null;
}

interface RegistroAlimento {
    id: number;
    nome: string;
    grupo: string | null;
    kcal: number | null;
    proteina_g: number | null;
    lipideos_g: number | null;
    carboidrato_g: number | null;
    fibra_g: number | null;
}

function normalizarAlimentos(registros: RegistroAlimento[], fonte: Exclude<FonteAlimento, 'Personalizado'>): Alimento[] {
    return registros.map((registro) => ({
        id: `${fonte.toLocaleLowerCase('pt-BR')}-${registro.id}`,
        nome: registro.nome,
        grupo: registro.grupo,
        fonte,
        kcal: registro.kcal,
        proteina_g: registro.proteina_g,
        lipideos_g: registro.lipideos_g,
        carboidrato_g: registro.carboidrato_g,
        fibra_g: registro.fibra_g
    }));
}

export const alimentosBase: Alimento[] = [
    ...normalizarAlimentos(tabelaTaco as RegistroAlimento[], 'TACO'),
    ...normalizarAlimentos(tabelaTucunduva as RegistroAlimento[], 'Tucunduva')
];
