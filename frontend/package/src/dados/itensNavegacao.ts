export interface ItemNavegacao {
    titulo?: string;
    icone?: string;
    caminho?: string;
    cabecalho?: string;
}

const itensNavegacao: ItemNavegacao[] = [
    { cabecalho: 'Menu principal' },
    { titulo: 'Planos alimentares', icone: 'notebook-minimalistic-line-duotone', caminho: '/planos-alimentares' },
    { titulo: 'Clientes', icone: 'users-group-rounded-linear', caminho: '/clientes' },
    // { titulo: 'Alterar senha', icone: 'lock-password-linear', caminho: '/alterar-senha' },
    // { titulo: 'Dados do nutricionista', icone: 'user-id-linear', caminho: '/dados-nutricionista' }
];

export default itensNavegacao;
