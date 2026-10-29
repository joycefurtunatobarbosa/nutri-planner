export interface Paciente {
    id: number;
    nome: string;
    dataNascimento: string;
    email: string;
    telefone: string;
    observacoes: string;
}

export type DadosPaciente = Omit<Paciente, 'id'>;

const CHAVE_PACIENTES = 'nutriplanner:pacientes';

const pacientesMock: Paciente[] = [
    { id: 1, nome: 'Mariana Costa', dataNascimento: '1991-03-14', email: 'mariana.costa@email.com', telefone: '(11) 98765-4321', observacoes: 'Foco em emagrecimento saudável.' },
    { id: 2, nome: 'Pedro Henrique', dataNascimento: '1998-07-22', email: 'pedro.henrique@email.com', telefone: '(21) 97654-3210', observacoes: 'Pratica musculação 5x por semana.' },
    { id: 3, nome: 'Camila Oliveira', dataNascimento: '1989-11-05', email: 'camila.oliveira@email.com', telefone: '(31) 98888-1122', observacoes: 'Intolerante à lactose.' },
    { id: 4, nome: 'Rafael Santos', dataNascimento: '1975-02-18', email: 'rafael.santos@email.com', telefone: '(41) 99777-3344', observacoes: 'Diabetes tipo 2.' },
    { id: 5, nome: 'Beatriz Almeida', dataNascimento: '1993-09-30', email: 'beatriz.almeida@email.com', telefone: '(51) 99666-5566', observacoes: '' },
    { id: 6, nome: 'Lucas Ferreira', dataNascimento: '1996-05-09', email: 'lucas.ferreira@email.com', telefone: '(61) 98555-7788', observacoes: 'Corredor amador, treina para meia maratona.' },
    { id: 7, nome: 'Fernanda Lima', dataNascimento: '1985-12-01', email: 'fernanda.lima@email.com', telefone: '(71) 98444-9900', observacoes: 'Síndrome do intestino irritável.' },
    { id: 8, nome: 'Gabriel Souza', dataNascimento: '2001-08-17', email: 'gabriel.souza@email.com', telefone: '(81) 98333-0011', observacoes: '' }
];

export function lerPacientes(): Paciente[] {
    try {
        const valorSalvo = localStorage.getItem(CHAVE_PACIENTES);

        // Na primeira utilização, grava os pacientes de exemplo para que possam ser editados ou excluídos.
        if (valorSalvo === null) {
            gravar(pacientesMock);
            return [...pacientesMock];
        }

        const dados: unknown = JSON.parse(valorSalvo);
        // Pacientes salvos antes do campo "dataNascimento" não o possuem no localStorage.
        return Array.isArray(dados)
            ? (dados as Paciente[]).map((paciente) => ({
                ...paciente,
                dataNascimento:
                    paciente.dataNascimento ??
                    pacientesMock.find((exemplo) => exemplo.id === paciente.id && exemplo.nome === paciente.nome)?.dataNascimento ??
                    ''
            }))
            : [];
    } catch (falha) {
        console.error('Não foi possível ler os pacientes salvos.', falha);
        return [];
    }
}

function gravar(pacientes: Paciente[]) {
    localStorage.setItem(CHAVE_PACIENTES, JSON.stringify(pacientes));
}

export function criarPaciente(dados: DadosPaciente): Paciente {
    const pacientes = lerPacientes();
    const paciente: Paciente = { ...dados, id: Date.now() };
    pacientes.unshift(paciente);
    gravar(pacientes);
    return paciente;
}

export function atualizarPaciente(paciente: Paciente): void {
    const pacientes = lerPacientes();
    const indice = pacientes.findIndex((item) => item.id === paciente.id);

    if (indice === -1) {
        throw new Error('O paciente que você tentou atualizar não foi encontrado.');
    }

    pacientes[indice] = paciente;
    gravar(pacientes);
}

export function excluirPaciente(id: number): void {
    gravar(lerPacientes().filter((paciente) => paciente.id !== id));
}

export function calcularIdade(dataNascimento: string, hoje = new Date()): number | null {
    const [ano, mes, dia] = dataNascimento.split('-').map(Number);

    if (!ano || !mes || !dia) {
        return null;
    }

    let idade = hoje.getFullYear() - ano;

    if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) {
        idade -= 1;
    }

    return idade >= 0 ? idade : null;
}

export function formatarDataNascimento(dataNascimento: string): string {
    const [ano, mes, dia] = dataNascimento.split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : '—';
}
