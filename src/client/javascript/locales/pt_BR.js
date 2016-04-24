/*!
 * OS.js - JavaScript Operating System
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function() {
  // jscs:disable validateQuoteMarks
  'use strict';

  OSjs.Locales = OSjs.Locales || {};

  OSjs.Locales.pt_BR = {
    //
    // CORE
    //

    'ERR_FILE_OPEN'             : 'Erro ao abrir arquivo',
    'ERR_WM_NOT_RUNNING'        : 'Gerenciador de janelas não está executando',
    'ERR_FILE_OPEN_FMT'         : 'O arquivo \'**{0}**\' não pôde ser aberto',
    'ERR_APP_MIME_NOT_FOUND_FMT': 'Não foi encontrado nenhum aplicativo com suporte para arquivos \'{0}\'',
    'ERR_APP_LAUNCH_FAILED'     : 'Falha em abrir aplicativo',
    'ERR_APP_LAUNCH_FAILED_FMT' : 'Um erro ocorreu na tentativa de abrir: {0}',
    'ERR_APP_CONSTRUCT_FAILED_FMT'  : 'Falha em construção do aplicativo \'{0}\': {1}',
    'ERR_APP_INIT_FAILED_FMT'       : 'Falha no init() do aplicativo \'{0}\': {1}',
    'ERR_APP_RESOURCES_MISSING_FMT' : 'O aplicativo \'{0}\' está faltando recursos ou falhou em inicializar!',
    'ERR_APP_PRELOAD_FAILED_FMT'    : 'O aplicativo \'{0}\' falhou no pré-carregamento: \n{1}',
    'ERR_APP_LAUNCH_ALREADY_RUNNING_FMT'    : 'O aplicativo \'{0}\' já está aberto e só permite uma instância!',
    'ERR_APP_LAUNCH_MANIFEST_FAILED_FMT'    : 'Falha em abrir \'{0}\'. Faltando informação sobre o pacote do aplicativo!',
    'ERR_APP_LAUNCH_COMPABILITY_FAILED_FMT' : 'Falha em abrir \'{0}\'. Seu navegador não suporta: {1}',

    'ERR_NO_WM_RUNNING'         : 'Gerenciador de janelas não está executando',
    'ERR_CORE_INIT_FAILED'      : 'Falha em inicializar OS.js',
    'ERR_CORE_INIT_FAILED_DESC' : 'Um erro ocorreu enquanto OS.js se inicializava',
    'ERR_CORE_INIT_NO_WM'       : 'Não é possivel começar OS.js: Nenhum Gerenciador de Janelas encontrado!',
    'ERR_CORE_INIT_WM_FAILED_FMT'   : 'Não é possível inciar OS.js: Falha em lançar o Gerenciador de Janelas: {0}',
    'ERR_CORE_INIT_PRELOAD_FAILED'  : 'Não é possível iniciar OS.js: Falha em pré-carregar recursos...',
    'ERR_JAVASCRIPT_EXCEPTION'      : 'Erro no JavaScript',
    'ERR_JAVACSRIPT_EXCEPTION_DESC' : 'Um erro inexperado ocorreu, talvez seja um bug.',

    'ERR_APP_API_ERROR'           : 'Erro na API do aplicativo',
    'ERR_APP_API_ERROR_DESC_FMT'  : 'Aplicativo {0} falhou em executar \'{1}\'',
    'ERR_APP_MISSING_ARGUMENT_FMT': 'Faltando argumento: {0}',
    'ERR_APP_UNKNOWN_ERROR'       : 'Erro desconhecido',

    'ERR_OPERATION_TIMEOUT'       : 'Operação está demorando muito',
    'ERR_OPERATION_TIMEOUT_FMT'   : 'Operação está demorando muito ({0})',

    // Window
    'ERR_WIN_DUPLICATE_FMT' : 'Você já possui uma janela chamada \'{0}\'',
    'WINDOW_MINIMIZE' : 'Minimizar',
    'WINDOW_MAXIMIZE' : 'Maximizar',
    'WINDOW_RESTORE'  : 'Restaurar',
    'WINDOW_CLOSE'    : 'Fechar',
    'WINDOW_ONTOP_ON' : 'No topo (Habilitar)',
    'WINDOW_ONTOP_OFF': 'No topo (Desabilitar)',

    // Handler
    'TITLE_SIGN_OUT' : 'Deslogar',
    'TITLE_SIGNED_IN_AS_FMT' : 'Logado como: {0}',

    // SESSION
    'MSG_SESSION_WARNING' : 'Você tem certeza que quer sair do OS.js? Todas as configurações e dados das aplicações não salvas serão perdidas!',

    // Service
    'BUGREPORT_MSG' : 'Por favor, reporte se você achar que isto é um bug.\nInclue uma breve descrição sobre como ocorreu o erro e, se possível, como refazê-lo',

    // API
    'SERVICENOTIFICATION_TOOLTIP' : 'Logado em serviços externos: {0}',

    // Utils
    'ERR_UTILS_XHR_FATAL' : 'Erro fatal',
    'ERR_UTILS_XHR_FMT' : 'Erro de AJAX/XHR: {0}',

    //
    // DIALOGS
    //
    'DIALOG_LOGOUT_TITLE' : 'Logout (Sair)', // Actually located in session.js
    'DIALOG_LOGOUT_MSG_FMT' : 'Deslogando usuário \'{0}\'.\nVocê quer salvar sessão atual?',

    'DIALOG_CLOSE' : 'Fechar',
    'DIALOG_CANCEL': 'Cancelar',
    'DIALOG_APPLY' : 'Aplicar',
    'DIALOG_OK'    : 'OK',

    'DIALOG_ALERT_TITLE' : 'Mensagem de Atenção',

    'DIALOG_COLOR_TITLE' : 'Cores',
    'DIALOG_COLOR_R' : 'Vermelho: {0}',
    'DIALOG_COLOR_G' : 'Verde: {0}',
    'DIALOG_COLOR_B' : 'Azul: {0}',
    'DIALOG_COLOR_A' : 'Alfa: {0}',

    'DIALOG_CONFIRM_TITLE' : 'Mensagem de Confirmação',

    'DIALOG_ERROR_MESSAGE'   : 'Mensagem',
    'DIALOG_ERROR_SUMMARY'   : 'Resumo',
    'DIALOG_ERROR_TRACE'     : 'Rastro',
    'DIALOG_ERROR_BUGREPORT' : 'Relate Bug',

    'DIALOG_FILE_SAVE'      : 'Salvar',
    'DIALOG_FILE_OPEN'      : 'Abrir',
    'DIALOG_FILE_MKDIR'     : 'Novo diretório',
    'DIALOG_FILE_MKDIR_MSG' : 'Criar novo diretório em **{0}**',
    'DIALOG_FILE_OVERWRITE' : 'Você realmente quer sobrescrever o arquivo \'{0}\'?',
    'DIALOG_FILE_MNU_VIEWTYPE' : 'Visuaizar tipo',
    'DIALOG_FILE_MNU_LISTVIEW' : 'Visualizar em lista',
    'DIALOG_FILE_MNU_TREEVIEW' : 'Visualizar em árvore',
    'DIALOG_FILE_MNU_ICONVIEW' : 'Visualizar em ícones',
    'DIALOG_FILE_ERROR'        : 'Mensagem de erro com arquivo',
    'DIALOG_FILE_ERROR_SCANDIR': 'Falha na listagem do diretório \'{0}\' por um erro',
    'DIALOG_FILE_MISSING_FILENAME' : 'Você precisa selecionar um arquivo ou introduzir um nome para o novo arquivo!',
    'DIALOG_FILE_MISSING_SELECTION': 'Você precisa selecionar um arquivo!',

    'DIALOG_FILEINFO_TITLE'   : 'Informação do arquivo',
    'DIALOG_FILEINFO_LOADING' : 'Carregando informação do arquivo: {0}',
    'DIALOG_FILEINFO_ERROR'   : 'Mensagem de erro sobre informação de arquivo',
    'DIALOG_FILEINFO_ERROR_LOOKUP'     : 'Falha em obter informação do arquivo **{0}**',
    'DIALOG_FILEINFO_ERROR_LOOKUP_FMT' : 'Falha em obter informação do arquivo: {0}',

    'DIALOG_INPUT_TITLE' : 'Diálogo de entrada',

    'DIALOG_FILEPROGRESS_TITLE'   : 'Operação em progresso',
    'DIALOG_FILEPROGRESS_LOADING' : 'Carregando...',

    'DIALOG_UPLOAD_TITLE'   : 'Janela de Upload',
    'DIALOG_UPLOAD_DESC'    : 'Upload de arquivo **{0}**.<br />Tamanho máximo: {1} bytes',
    'DIALOG_UPLOAD_MSG_FMT' : 'Fazendo upload \'{0}\' ({1} {2}) to {3}',
    'DIALOG_UPLOAD_MSG'     : 'Fazendo upload do arquivo...',
    'DIALOG_UPLOAD_FAILED'  : 'Upload falhou',
    'DIALOG_UPLOAD_FAILED_MSG'      : 'O upload falhou',
    'DIALOG_UPLOAD_FAILED_UNKNOWN'  : 'Razão desconhecida...',
    'DIALOG_UPLOAD_FAILED_CANCELLED': 'Cancelado pelo usuário...',
    'DIALOG_UPLOAD_TOO_BIG': 'O arquivo é muito grande',
    'DIALOG_UPLOAD_TOO_BIG_FMT': 'O arqyuvo é muito grande, excede {0}',

    'DIALOG_FONT_TITLE' : 'Janela de tipografia',

    'DIALOG_APPCHOOSER_TITLE' : 'Escolher aplicação',
    'DIALOG_APPCHOOSER_MSG'   : 'Escolhar uma aplicação para abrir',
    'DIALOG_APPCHOOSER_NO_SELECTION' : 'Precisa escolher uma aplicação',
    'DIALOG_APPCHOOSER_SET_DEFAULT'  : 'Usar como aplicação padrão para {0}',

    //
    // HELPERS
    //

    // GoogleAPI
    'GAPI_DISABLED'           : 'Módulo do GoogleAPI não está configurado ou está desativado',
    'GAPI_SIGN_OUT'           : 'Desconectar dos serviços do Google API',
    'GAPI_REVOKE'             : 'Retirar permissões e desconectar',
    'GAPI_AUTH_FAILURE'       : 'A tentativa de autenticação com o Google API falhou',
    'GAPI_AUTH_FAILURE_FMT'   : 'Falha ao tentar autenticar: {0}:{1}',
    'GAPI_LOAD_FAILURE'       : 'Não pôde carregar Google API',

    // Windows Live API
    'WLAPI_DISABLED'          : 'Módulo do Windows Live API não está configurado ou está desativado',
    'WLAPI_SIGN_OUT'          : 'Desconectar do Window Live API',
    'WLAPI_LOAD_FAILURE'      : 'Falha em carregar Windows Live API',
    'WLAPI_LOGIN_FAILED'      : 'Falha em conectar ao Windows Live API',
    'WLAPI_LOGIN_FAILED_FMT'  : 'Falha em conectar ao Windows Live API: {0}',
    'WLAPI_INIT_FAILED_FMT'   : 'Windows Live API retornou código {0}',

    // IndexedDB
    'IDB_MISSING_DBNAME' : 'Não é possível criar IndexedDB sem nome do Banco de Dados',
    'IDB_NO_SUCH_ITEM'   : 'Não existe este elemento',

    //
    // VFS
    //
    'ERR_VFS_FATAL'           : 'Erro fatal',
    'ERR_VFS_UNAVAILABLE'     : 'Não está disponível',
    'ERR_VFS_FILE_ARGS'       : 'Arquivo espera ao menos um argumento',
    'ERR_VFS_NUM_ARGS'        : 'Argumentos insuficientes',
    'ERR_VFS_EXPECT_FILE'     : 'Espera ao menos um objeto de arquivo',
    'ERR_VFS_EXPECT_SRC_FILE' : 'Espera ao menos a origem de um objeto de arquivo',
    'ERR_VFS_EXPECT_DST_FILE' : 'Espera ao menos o destino de um objeto de arquivo',
    'ERR_VFS_FILE_EXISTS'     : 'Destino já existe',
    'ERR_VFS_TRANSFER_FMT'    : 'Um erro ocorreu ao transferir entre discos de armazenamento: {0}',
    'ERR_VFS_UPLOAD_NO_DEST'  : 'Não é possível fazer upload de arquivo sem destino',
    'ERR_VFS_UPLOAD_NO_FILES' : 'Não é possível fazer upload sem arquivos definidos',
    'ERR_VFS_UPLOAD_FAIL_FMT' : 'Falha em upload: {0}',
    'ERR_VFS_UPLOAD_CANCELLED': 'Upload foi cancelado',
    'ERR_VFS_DOWNLOAD_NO_FILE': 'Não é possível fazer download de destino sem destino',
    'ERR_VFS_DOWNLOAD_FAILED' : 'Ocorreu um erro enquanto fazia download: {0}',
    'ERR_VFS_REMOTEREAD_EMPTY': 'Resposta vazia',
    'TOOLTIP_VFS_DOWNLOAD_NOTIFICATION': 'Fazendo download de arquivo',

    'ERR_VFSMODULE_XHR_ERROR'      : 'Erro XHR',
    'ERR_VFSMODULE_ROOT_ID'        : 'Falha em achar a raiz do diretório',
    'ERR_VFSMODULE_NOSUCH'         : 'Arquivo não existe',
    'ERR_VFSMODULE_PARENT'         : 'Não existe o pai',
    'ERR_VFSMODULE_PARENT_FMT'     : 'Falha em encontrar o pai: {0}',
    'ERR_VFSMODULE_SCANDIR'        : 'Falhou em localizar o diretório',
    'ERR_VFSMODULE_SCANDIR_FMT'    : 'Falhou em localizar o diretório: {0}',
    'ERR_VFSMODULE_READ'           : 'Falha em ler o arquivo',
    'ERR_VFSMODULE_READ_FMT'       : 'Falha em ler o arquivo: {0}',
    'ERR_VFSMODULE_WRITE'          : 'Falha em escrever o arquivo',
    'ERR_VFSMODULE_WRITE_FMT'      : 'Falha em escrever o arquivo: {0}',
    'ERR_VFSMODULE_COPY'           : 'Cópia falhou',
    'ERR_VFSMODULE_COPY_FMT'       : 'Cópia falhou: {0}',
    'ERR_VFSMODULE_UNLINK'         : 'Falha em desvincular o arquivo',
    'ERR_VFSMODULE_UNLINK_FMT'     : 'Falha em desvincular o arquivo: {0}',
    'ERR_VFSMODULE_MOVE'           : 'Falha em mover o arquivo',
    'ERR_VFSMODULE_MOVE_FMT'       : 'Falha em mover o arquivo: {0}',
    'ERR_VFSMODULE_EXIST'          : 'Falha em conferir a existência do arquivo',
    'ERR_VFSMODULE_EXIST_FMT'      : 'Falha em conferir a existência do arquivo: {0}',
    'ERR_VFSMODULE_FILEINFO'       : 'Falha em obter informação do arquivo',
    'ERR_VFSMODULE_FILEINFO_FMT'   : 'Falha em obter informação do arquivo: {0}',
    'ERR_VFSMODULE_MKDIR'          : 'Falha em criar diretório',
    'ERR_VFSMODULE_MKDIR_FMT'      : 'Falha em criar diretório: {0}',
    'ERR_VFSMODULE_URL'            : 'Falha em obter URL do arquivo',
    'ERR_VFSMODULE_URL_FMT'        : 'Falha em obter URL do arquivo: {0}',
    'ERR_VFSMODULE_TRASH'          : 'Falha em mover arquivo para lixeira',
    'ERR_VFSMODULE_TRASH_FMT'      : 'Falha em mover arquivo para lixeira: {0}',
    'ERR_VFSMODULE_UNTRASH'        : 'Falha em recuperar arquivo da lixeira',
    'ERR_VFSMODULE_UNTRASH_FMT'    : 'Falha em recuperar arquivo da lixeira: {0}',
    'ERR_VFSMODULE_EMPTYTRASH'     : 'Falha em esvaziar a lixeira',
    'ERR_VFSMODULE_EMPTYTRASH_FMT' : 'Falha em esvaziar a lixeira: {0}',

    // VFS -> Dropbox
    'DROPBOX_NOTIFICATION_TITLE' : 'Você logou à API do Dropbox',
    'DROPBOX_SIGN_OUT'           : 'Desconectar dos serviços da API do Google',

    // VFS -> OneDrive
    'ONEDRIVE_ERR_RESOLVE'      : 'Falha em encontrar a rota: arquivo não encontrado',

    //
    // PackageManager
    //

    'ERR_PACKAGE_EXISTS': 'Diretório de instalação já existe, por favor escolha outro para continuar',

    //
    // DefaultApplication
    //
    'ERR_FILE_APP_OPEN'         : 'Não é possível abrir o arquivo',
    'ERR_FILE_APP_OPEN_FMT'     : 'O arquivo {0} não pode ser aberto pois não existe suporte para {1}',
    'ERR_FILE_APP_OPEN_ALT_FMT' : 'O arquivo {0} não pode ser aberto',
    'ERR_FILE_APP_SAVE_ALT_FMT' : 'O arquivo {0} Não pode ser salvo',
    'ERR_GENERIC_APP_FMT'       : 'O aplicativo encontrou um erro {0}',
    'ERR_GENERIC_APP_ACTION_FMT': 'Falha em realizar ação \'{0}\'',
    'ERR_GENERIC_APP_UNKNOWN'   : 'Erro desconhecido',
    'ERR_GENERIC_APP_REQUEST'   : 'Um erro ocorreu durante sua requisição',
    'ERR_GENERIC_APP_FATAL_FMT' : 'Erro fatal: {0}',
    'MSG_GENERIC_APP_DISCARD'   : 'Descartar mudanças?',
    'MSG_FILE_CHANGED'          : 'O arquivo sofreu alterações. Recarregar?',
    'MSG_APPLICATION_WARNING'   : 'Advertência do aplicativo',
    'MSG_MIME_OVERRIDE'         : 'A extensão "{0}" não é suportada, usando "{1}".',

    //
    // General
    //

    'LBL_UNKNOWN'      : 'Desconhecido',
    'LBL_APPEARANCE'   : 'Aparência',
    'LBL_USER'         : 'Usuário',
    'LBL_NAME'         : 'Nome',
    'LBL_APPLY'        : 'Aplicar',
    'LBL_FILENAME'     : 'Nome do arquivo',
    'LBL_PATH'         : 'Caminho',
    'LBL_SIZE'         : 'Tamanho',
    'LBL_TYPE'         : 'Tipo',
    'LBL_MIME'         : 'MIME',
    'LBL_LOADING'      : 'Carregando',
    'LBL_SETTINGS'     : 'Configurações',
    'LBL_ADD_FILE'     : 'Adicionar arquivo',
    'LBL_COMMENT'      : 'Comentário',
    'LBL_ACCOUNT'      : 'Conta',
    'LBL_CONNECT'      : 'Conectar',
    'LBL_ONLINE'       : 'Online',
    'LBL_OFFLINE'      : 'Offline',
    'LBL_AWAY'         : 'Indisponível',
    'LBL_BUSY'         : 'Ocupado',
    'LBL_CHAT'         : 'Chat',
    'LBL_HELP'         : 'Ajuda',
    'LBL_ABOUT'        : 'Sobre',
    'LBL_PANELS'       : 'Paineis',
    'LBL_LOCALES'      : 'Internacionalização',
    'LBL_THEME'        : 'Tema',
    'LBL_COLOR'        : 'Cor',
    'LBL_PID'          : 'PID',
    'LBL_KILL'         : 'Kill',
    'LBL_ALIVE'        : 'Alive',
    'LBL_INDEX'        : 'Índice',
    'LBL_ADD'          : 'Adicionar',
    'LBL_FONT'         : 'Tipografia',
    'LBL_YES'          : 'Sim',
    'LBL_NO'           : 'Não',
    'LBL_CANCEL'       : 'Cancelar',
    'LBL_TOP'          : 'Acima',
    'LBL_LEFT'         : 'Esquerda',
    'LBL_RIGHT'        : 'Direita',
    'LBL_BOTTOM'       : 'Abaixo',
    'LBL_CENTER'       : 'Centro',
    'LBL_FILE'         : 'Arquivo',
    'LBL_NEW'          : 'Novo',
    'LBL_OPEN'         : 'Abrir',
    'LBL_SAVE'         : 'Salvar',
    'LBL_SAVEAS'       : 'Salvar como...',
    'LBL_CLOSE'        : 'Fechar',
    'LBL_MKDIR'        : 'Criar diretório',
    'LBL_UPLOAD'       : 'Fazer upload',
    'LBL_VIEW'         : 'Visualizar',
    'LBL_EDIT'         : 'Editar',
    'LBL_RENAME'       : 'Renomear',
    'LBL_DELETE'       : 'Excluir',
    'LBL_OPENWITH'     : 'Abrir com...',
    'LBL_ICONVIEW'     : 'Visualização por ícones',
    'LBL_TREEVIEW'     : 'Visualização por árvore',
    'LBL_LISTVIEW'     : 'Visualização por lista',
    'LBL_REFRESH'      : 'Recarregar',
    'LBL_VIEWTYPE'     : 'Ver tipo',
    'LBL_BOLD'         : 'Negrito',
    'LBL_ITALIC'       : 'Itálico',
    'LBL_UNDERLINE'    : 'Sublinhado',
    'LBL_REGULAR'      : 'Regular',
    'LBL_STRIKE'       : 'Rsicado',
    'LBL_INDENT'       : 'Indentar',
    'LBL_OUTDENT'      : 'Voltar',
    'LBL_UNDO'         : 'Desfazer',
    'LBL_REDO'         : 'Refazer',
    'LBL_CUT'          : 'Cortar',
    'LBL_UNLINK'       : 'Desvincular',
    'LBL_COPY'         : 'Copiar',
    'LBL_PASTE'        : 'Colar',
    'LBL_INSERT'       : 'Inserir',
    'LBL_IMAGE'        : 'Imagem',
    'LBL_LINK'         : 'Link',
    'LBL_DISCONNECT'    : 'Desconectar',
    'LBL_APPLICATIONS'  : 'Aplicativos',
    'LBL_ADD_FOLDER'    : 'Adicionar diretório',
    'LBL_INFORMATION'   : 'Informação',
    'LBL_TEXT_COLOR'    : 'Cor do texto',
    'LBL_BACK_COLOR'    : 'Cor de fundo',
    'LBL_RESET_DEFAULT' : 'Redefinir usando valores padrões',
    'LBL_DOWNLOAD_COMP' : 'Fazer download para o computador',
    'LBL_ORDERED_LIST'  : 'Lista ordenada',
    'LBL_BACKGROUND_IMAGE' : 'Imagem de fundo',
    'LBL_BACKGROUND_COLOR' : 'Cor de fundo',
    'LBL_UNORDERED_LIST'   : 'Lista não ordenada',
    'LBL_STATUS'   : 'Status',
    'LBL_READONLY' : 'Somente leitura',
    'LBL_CREATED' : 'Criado',
    'LBL_MODIFIED' : 'Modificado',
    'LBL_SHOW_COLUMNS' : 'Mostrar colunas',
    'LBL_MOVE' : 'Mover',
    'LBL_OPTIONS' : 'Opções',
    'LBL_OK' : 'OK',
    'LBL_DIRECTORY' : 'Diretório',
    'LBL_CREATE' : 'Criar',
    'LBL_BUGREPORT' : 'Reportar Bug',
    'LBL_INSTALL' : 'Instalar',
    'LBL_UPDATE' : 'Atualizar',
    'LBL_REMOVE' : 'Remover'
  };

})();
