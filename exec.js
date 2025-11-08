/**
 * Código para enviar atualizações ao servidor
 * do Obanai-v5 sem precisar entrar na 
 * api - hospedagem
 * Rápido, Simples e Fácil de Usar
 *
 * OBS: Este é um script de exemplo, porém
 * apenas o Kynx Modz tem permissão de usar
 *
 * @author - Kynx Modz - Obanai-v5
 */

console.info('[ INFO ] - Iniciando Execução - Lm Only.');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_NO_WARNINGS = '1';

import { request } from 'undici';
import { existsSync } from 'node:fs';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import 'dotenv/config';

if (['-h', '--help'].some(i => process.argv.includes(i))) {
    const HELP_TEXT = await readFile('./help.txt', 'utf-8');
    console.info(HELP_TEXT);
    process.exit(1);
}

const BASE_URL = process.env.BASE_URL;
const MAIN_PATH = 'MAIN_PATH_FILES';
const FOLDERS = [
    'arquivos',
    'assets'
];

const updatePath = ./UPDATES/updates.json;
(function (isUpdate) {
    if (isUpdate && !existsSync(updatePath)) {
        console.log('Arquivo necessário não encontrado!');
        process.exit(1);
    }
})(process.argv.includes('--update'));

const originalExit = process.exit;
process.exit = (code = 0) => {
    console.info('[ INFO ] - Finalizando Execução - Lm Only.');
    originalExit(code);
};

const updates = JSON.parse(await readFile(updatePath, 'utf-8'));

/**
 * Envia arquivos pro servidor de forma organizada.
 * 
 * @params {String} fileName - Nome do arquivo
 * @params {String} folderName - Nome da pasta do sistema
 * @params {String} path - Caminho completo até arquivo 
 */
const sendFileToServer = async (fileName, folderName, path) => {
    const searchParams = new URLSearchParams();

    searchParams.append('dir', folderName);
    searchParams.append('filename', fileName);
    searchParams.append('token', process.env.TOKEN);
    const params = searchParams.toString();

    try {
        const fileContent = await readFile(path + '/' + fileName);
        const {
            body,
            statusCode
        } = await request(BASE_URL + '/setfile?' + params, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            },
            body: fileContent
        });
        const data = await body.text();
        console.info([ INFO ] - Server StatusCode: ${statusCode}\n +
            [ INFO ] - Server Message: ${data});
    } catch (error) {
        console.error(error);
    }
};

/**
 * Obtém atualização atual do servidor
 * e soma +1 para o local
 * depois envia pro servidor novamente
 *
 * @params {Number} serverUpdates - Contagem de atualizações
 */
const setUpdate = async (serverUpdates) => {
    try {
        const updatesText = await readFile('./UPDATES/update.txt', 'utf-8');
        if (!updatesText.length) {
            console.error('[ ERROR ] - Sem conteúdo no updates.');
            process.exit(1);
        }
    
        updates.updates = serverUpdates + 1;
        updates.message = updatesText;

        await writeFile(updatePath, JSON.stringify(updates, null, 2));
        await sendFileToServer('updates.json', 'assets', './UPDATES');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

/** Organiza arquivos para enviar ao servidor */
const setFiles = async (files, folderName, folder) => {
    for (const file of files) {
        if (!process.argv.includes('--script') && folderName === 'assets' && file === 'script.sh') {
            console.info('[ INFO ] - No script activated, ignoring: script.sh');
            continue;
        }
        
        if (file.endsWith('.bak') || !file.includes('.')) {
            console.info([ INFO ] - Ignoring: "${file}" is not valid.);
            continue;
        }
        
        console.info([ INFO ] - Enviando "${file}" da pasta "${folderName}" para o servidor.);
        await sendFileToServer(file, folderName, folder);
    }
};

/**
 * Obtém a contagem de atualizações 
 * mais recentes do servidor
 *
 * @returns {Nunber}
 */
const getLastUpdates = async () => {
    const {
        body
    } = await request(BASE_URL + '/updates');
    const json = await body.json();
    return json.updates;
};

function* updateProcess() {
    let serverUpdates = 0;
    yield async () => {
        console.info('[ INFO ] - Adicionando updates.');
        serverUpdates = await getLastUpdates();
        await setUpdate(serverUpdates);
        console.info('[ INFO ] - Set updates success.');
    };
    yield console.info([ INFO ] - Success update: ${serverUpdates} -> ${updates.updates});
}
         
/** Deleta um usuário a partir de um input */
const userDelete = async () => {
    const index = process.argv.indexOf('--delete-user') + 1;
    if (!process.argv[index]) {
        console.error('[ ERROR ] - Delete user: Número inválido.');
        process.exit();
    }
    
    const number = process.argv.slice(index).join(' ').replace(/[^0-9]/g, '');
    console.info([ INFO ] - Delete user: Verificando ${number} no servidor.);
    
    const searchParams = new URLSearchParams();    
    searchParams.append('user', number);
    searchParams.append('token', process.env.TOKEN);
    const params = searchParams.toString();
    
    try {
        const {
            body,
            statusCode
        } = await request(BASE_URL + '/deleteuser?' + params);
        const data = await body.text();
        
        console.info([ INFO ] - Delete user: StatusCode -> ${statusCode});
        console.info([ INFO ] - Delete user: Message -> ${data});
    } catch (e) {
        console.error(e);
    }
    
    process.exit();
};

/** Checa um usuário a partir de um input */
const checkUser = async () => {
    const index = process.argv.indexOf('--check') + 1;
    if (!process.argv[index]) {
        console.error('[ ERROR ] - Check user: Número inválido.');
        process.exit();
    }
    
    const number = process.argv.slice(index).join(' ').replace(/[^0-9]/g, '');
    console.info([ INFO ] - Check user: Verificando ${number} no servidor.);
    
    try {
        const {
            body,
            statusCode
        } = await request(BASE_URL + '/users');
        const data = await body.json();
        
        console.info([ INFO ] - Check user: StatusCode -> ${statusCode});        
        console.info([ INFO ] - Check user: Message -> user ${data.includes(number) ? 'existe ✅' : 'não existe ❌'});
    } catch (e) {
        console.error(e);
    }
    
    process.exit();
};

const MAIN_FUNCTION = async () => {
    if (process.argv.includes('--check')) {
        console.info('[ INFO ] - Check User: Verificando user.');
        void await checkUser();
    }
            
    if (process.argv.includes('--delete-user')) {
        console.info('[ INFO ] - Delete user: Verificando user.');
        void await userDelete();
    }
    
    if (process.argv.includes('--last-update')) {
        console.info('[ INFO ] - Obtendo últimas atualizações.');
        const serverUpdates = await getLastUpdates();
        console.info([ INFO ] - Server updates: ${serverUpdates} -> Local: ${updates.updates});
        process.exit(1);
    }

    const upProcess = updateProcess();
    if (process.argv.includes('--update')) {
        void await upProcess.next().value();
    }

    for (const folder of FOLDERS) {
        try {
            if (process.argv.includes('--no-files')) {
                console.info('[ INFO ] - No files ativado, quebrando execução.');
                break;
            }

            const realpath = ./${MAIN_PATH}/${folder};
            const files = await readdir(realpath);
            if (!files.length) continue;

            await setFiles(files, folder, realpath);
        } catch {}
    }

    if (process.argv.includes('--update')) {
        void upProcess.next().value;
    }

    console.info('[ INFO ] - Finalizando Execução - Kynx Modz.');
};

MAIN_FUNCTION();
