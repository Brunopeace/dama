import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDfHgyEtEhV9C8_9qq4ij8YehJBtfoo6vg",
    authDomain: "dama-e4106.firebaseapp.com",
    databaseURL: "https://dama-e4106-default-rtdb.firebaseio.com",
    projectId: "dama-e4106",
    storageBucket: "dama-e4106.firebasestorage.app",
    messagingSenderId: "210757872906",
    appId: "1:210757872906:web:6df8f84418976330dcdef3"
};

// --- CONFIGURAÇÃO FIREBASE ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 1. PRIMEIRO: Definir todas as referências (o endereço dos dados)
const gameRef = ref(db, 'partida_unica');
const emojiRef = ref(db, 'partida_unica/ultimo_emoji');
const nomesRef = ref(db, 'partida_unica/nomes');
const playersRef = ref(db, 'partida_unica/jogadores'); // Criado antes de usar!

// ATUALIZE o ouvinte do Firebase para o oponente ver o emoji
onValue(emojiRef, (snap) => {
    const data = snap.val();
    if (data && data.lado !== meuLado) {
        // Se o timestamp for recente (menos de 2 segundos), mostra o emoji
        if (Date.now() - data.timestamp < 2000) {
            dispararEfeitoEmoji(data.emoji, data.lado);
        }
    }
});

// Monitor de nomes (Sincroniza Bruno e Lucas no placar)
onValue(nomesRef, (snap) => {
    // Se não estiver online, ignore atualizações de nomes vindas da nuvem
    if (modoJogo !== 'online') return;
    
    const nomes = snap.val() || {};
    if (nomes.vermelho) document.getElementById('input-nome-v').value = nomes.vermelho;
    if (nomes.preto) document.getElementById('input-nome-p').value = nomes.preto;
});

// Variável para comparar o estado anterior (coloque fora da função onValue)
onValue(playersRef, (snap) => {
    if (modoJogo !== 'online') return;
    
    const jogadoresAtuais = snap.val() || {};
    const btnV = document.getElementById('btn-escolher-vermelho');
    const btnP = document.getElementById('btn-escolher-preto');
    
    // 1. NOTIFICAÇÃO DE ENTRADA (Saber quem acabou de entrar)
    // Se o Vermelho não estava no banco e agora está, e não sou eu
    if (jogadoresAtuais.vermelho && !jogadoresAntigos.vermelho) {
        if (meuLado !== 'vermelho') notificarEntrada('Vermelho');
    }
    // Se o Preto não estava no banco e agora está, e não sou eu
    if (jogadoresAtuais.preto && !jogadoresAntigos.preto) {
        if (meuLado !== 'preto') notificarEntrada('Preto');
    }

    // 2. GERENCIAMENTO DOS BOTÕES DE ESCOLHA
    if (btnV) {
        if (jogadoresAtuais.vermelho) {
            btnV.disabled = true;
            btnV.style.display = 'none';
        } else {
            btnV.disabled = false;
            btnV.style.display = 'flex';
            btnV.innerText = "Vermelho Disponível";
        }
    }

    if (btnP) {
        if (jogadoresAtuais.preto) {
            btnP.disabled = true;
            btnP.style.display = 'none';
        } else {
            btnP.disabled = false;
            btnP.style.display = 'flex';
            btnP.innerText = "Preto Disponível";
        }
    }

    // 3. LÓGICA DE STATUS ONLINE E TRAVA DE JOGO
    const totalJogadores = Object.keys(jogadoresAtuais).length;
    
    // Atualiza os pontinhos verde/cinza no placar
    atualizarIndicadoresStatus(jogadoresAtuais);

    if (totalJogadores === 2) {
        if (!jogoIniciado) {
            console.log("Partida Pronta! Ambos os jogadores estão online.");
        }
        jogoIniciado = true;
    } else {
        jogoIniciado = false;
    }

    // Guarda o estado atual para a próxima comparação
    jogadoresAntigos = { ...jogadoresAtuais };
});

// Função para exibir o alerta visual de entrada
function notificarEntrada(lado) {
    const alerta = document.createElement('div');
    alerta.className = 'feedback-entrada';
    alerta.innerHTML = `<span>🎮</span> Jogador <b>${lado}</b> entrou na sala!`;
    document.body.appendChild(alerta);

    // Remove automaticamente após 3 segundos
    setTimeout(() => {
        alerta.style.opacity = '0';
        setTimeout(() => alerta.remove(), 1000);
    }, 3000);
}

// Função auxiliar para atualizar as bolinhas de status
function atualizarIndicadoresStatus(jogadores) {
    const statusV = document.getElementById('ponto-status-v'); // Crie esses IDs no HTML
    const statusP = document.getElementById('ponto-status-p');
    const textoV = document.getElementById('texto-status-v');
    const textoP = document.getElementById('texto-status-p');

    // Status Vermelho
    if (jogadores.vermelho) {
        if (statusV) statusV.classList.add('online');
        if (textoV) textoV.innerText = "Online";
    } else {
        if (statusV) statusV.classList.remove('online');
        if (textoV) textoV.innerText = "Aguardando...";
    }

    // Status Preto
    if (jogadores.preto) {
        if (statusP) statusP.classList.add('online');
        if (textoP) textoP.innerText = "Online";
    } else {
        if (statusP) statusP.classList.remove('online');
        if (textoP) textoP.innerText = "Aguardando...";
    }
}


// Monitor do estado do Tabuleiro (Sincroniza as peças e o turno)
// APAGUE OS DOIS ANTERIORES E USE APENAS ESTE:
onValue(gameRef, (snapshot) => {
    if (modoJogo !== 'online') return;
    
    const data = snapshot.val();
    if (!data || !data.mapa) return;

    // A TRAVA: Se eu selecionei uma peça, ignoro a atualização do banco
    // para que o meu clique não seja cancelado pela rede.
    if (selecionada !== null) return;

    // Atualiza as variáveis globais com os dados que vieram da nuvem
    mapa = data.mapa;
    turno = data.turno;
    capturasV = data.capturasV;
    capturasP = data.capturasP;
    
    // Atualiza o visual
    desenhar();
    
    // Chama as funções de interface se elas existirem
    if (typeof atualizarUI === 'function') atualizarUI();
    if (typeof atualizarDestaqueTurno === 'function') atualizarDestaqueTurno();

    console.log("Tabuleiro sincronizado. Turno atual:", turno);
});

// --- VARIÁVEIS GLOBAIS ---
let jogoIniciado = false;
let temporizadoresSaida = {};
let jogadoresAntigos = {};
let nomesAnteriores = {};
let modoJogo = 'online'; 
let meuLado = new URLSearchParams(window.location.search).get('lado'); 
let mapa = [];
let turno = 1; 
let capturasV = 0;
let capturasP = 0;
let selecionada = null;
const tabElement = document.getElementById('tabuleiro');

// --- SONS ---
const somMove = new Audio('movimento.mp3');
const somCap = new Audio('movimento.mp3');

function tocarSom(tipo) {
    const s = (tipo === 'move') ? somMove : somCap;
    s.currentTime = 0; 
    s.play().catch(() => {});
}

// --- LÓGICA DE INSTALAÇÃO PWA ---
let deferredPrompt;
const btnInstalar = document.getElementById('btn-instalar');
const containerInstalar = document.getElementById('pwa-install-container');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    containerInstalar.style.display = 'block';
});

btnInstalar.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') containerInstalar.style.display = 'none';
        deferredPrompt = null;
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Adicionamos o { scope: './' } para garantir que ele se limite à pasta atual
        navigator.serviceWorker.register('./service-worker.js', { scope: './' })
        .then(reg => {
            console.log('SW do Jogo de Dama registrado ✅! Escopo:', reg.scope);
        }).catch(err => {
            console.log('Erro ao registrar SW:', err);
        });
    });
}

// --- SISTEMA DE FOTOS DO PLACAR (ATÉ 2MB COM COMPRESSÃO) ---
window.carregarFoto = function(event, imgId, iconId) {
    const file = event.target.files[0];
    const limiteMB = 2;
    const limiteBytes = limiteMB * 1024 * 1024; // 2.097.152 bytes

    if (file) {
        // 1. Verifica se o arquivo ultrapassa 2MB
        if (file.size > limiteBytes) {
            alert(`A imagem é muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Escolha uma de até 2MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const imgOriginal = new Image();
            imgOriginal.src = e.target.result;

            imgOriginal.onload = function() {
                // 2. Criar um Canvas para comprimir a imagem
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Define o tamanho máximo do avatar (ex: 150x150 pixels)
                // Isso economiza MUITO espaço no Firebase e memória no celular
                const maxWidth = 150;
                const maxHeight = 150;
                let width = imgOriginal.width;
                let height = imgOriginal.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(imgOriginal, 0, 0, width, height);

                // 3. Converte para Base64 com qualidade reduzida (0.7 = 70%)
                const base64Comprimida = canvas.toDataURL('image/jpeg', 0.7);

                // 4. Atualiza visualmente no placar
                const imgElement = document.getElementById(imgId);
                const iconElement = document.getElementById(iconId);

                if (imgElement) {
                    imgElement.src = base64Comprimida;
                    imgElement.style.display = 'block';
                }
                if (iconElement) {
                    iconElement.style.display = 'none';
                }

                // 5. Se for Online, envia a versão leve para o Firebase
                if (typeof modoJogo !== 'undefined' && modoJogo === 'online') {
                    // Certifique-se que 'db' e 'ref/set' estão acessíveis aqui
                    const fotoRef = ref(db, `partida_unica/fotos/${meuLado}`);
                    set(fotoRef, base64Comprimida).catch(err => console.error("Erro ao subir foto:", err));
                }
            };
        };
        reader.readAsDataURL(file);
    }
};

window.alterarNome = function(lado) {
    // Só permite alterar o próprio nome no modo online
    const ladoLongo = lado === 'v' ? 'vermelho' : 'preto';
    if (modoJogo === 'online' && ladoLongo !== meuLado) {
        alert("Você não pode alterar o nome do adversário!");
        // O onValue acima vai restaurar o nome correto automaticamente
        return;
    }

    const inputId = lado === 'v' ? 'input-nome-v' : 'input-nome-p';
    const novoNome = document.getElementById(inputId).value.trim();
    
    if (modoJogo === 'online' && novoNome !== "") {
        set(ref(db, `partida_unica/nomes/${ladoLongo}`), novoNome);
    }
};



// --- SISTEMA DE EMOJIS ---
window.abrirModalEmoji = function(ladoDoBotao) {
    if (modoJogo === 'online' && ladoDoBotao !== meuLado) return;
    document.getElementById('modal-emoji-selecao').classList.add('active');
};

document.addEventListener('mousedown', (event) => {
    const modal = document.getElementById('modal-emoji-selecao');
    if (modal?.classList.contains('active') && event.target === modal) {
        modal.classList.remove('active');
    }
});

function exibirEmojiNaTela(emoji, lado) {
    const boxId = lado === 'vermelho' ? 'box-vermelho' : 'box-preto';
    const box = document.getElementById(boxId);
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'float-emoji';
    el.innerText = emoji;
    box.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

onValue(emojiRef, (snap) => {
    const d = snap.val();
    if (d && d.ts > Date.now() - 3000) exibirEmojiNaTela(d.texto, d.lado);
});

// --- LÓGICA DO JOGO ---
window.selecionarModoCard = (modo) => {
    const nome = document.getElementById('modal-input-nome').value.trim();
    
    // Validação Profissional: Não deixa escolher o modo sem o nome
    if (nome.length < 3) {
        const erro = document.getElementById('nome-error');
        erro.innerText = "Digite seu nome";
        document.getElementById('modal-input-nome').style.borderColor = "#ff5f6d";
        return;
    }

    // Limpa erros
    document.getElementById('nome-error').innerText = "";
    document.getElementById('modal-input-nome').style.borderColor = "#333";

    // Define o modo
    modoJogo = modo;

    // Feedback visual nos cards
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    document.getElementById(`card-${modo}`).classList.add('selected');

    // Mostra a escolha de lados com animação
    const sideSelection = document.getElementById('side-selection');
    sideSelection.style.display = 'block';
    sideSelection.style.animation = 'fadeIn 0.5s ease';
};

window.confirmarCadastro = (ladoEscolhido) => {
    const nomeInput = document.getElementById('modal-input-nome');
    const nomeDigitado = nomeInput.value.trim();

    if (nomeDigitado === "") {
        alert("Por favor, digite seu nome!");
        return;
    }

    // 1. ATUALIZAÇÃO DA VARIÁVEL GLOBAL
    meuLado = ladoEscolhido; 

    // 2. INVERSÃO VISUAL DA INTERFACE
    if (meuLado === 'preto') {
        document.body.classList.add('visao-preto');
    } else {
        document.body.classList.remove('visao-preto');
    }

    // 3. ATUALIZAÇÃO LOCAL DO NOME NO PLACAR
    const idMeuInput = (meuLado === 'vermelho') ? 'input-nome-v' : 'input-nome-p';
    const campoNome = document.getElementById(idMeuInput);
    if (campoNome) campoNome.value = nomeDigitado;

    if (modoJogo === 'online') {
        // 4. REFERÊNCIAS E SALVAMENTO NO FIREBASE
        const playerStatusRef = ref(db, `partida_unica/jogadores/${ladoEscolhido}`);
        const playerNameRef = ref(db, `partida_unica/nomes/${ladoEscolhido}`);
        const playerPhotoRef = ref(db, `partida_unica/fotos/${ladoEscolhido}`);

        set(playerStatusRef, true);
        set(playerNameRef, nomeDigitado);
        
        // 5. CONFIGURAÇÃO DE DESCONEXÃO
        import("https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js").then(pkg => {
            pkg.onDisconnect(playerStatusRef).remove();
            pkg.onDisconnect(playerNameRef).remove();
            pkg.onDisconnect(playerPhotoRef).remove();
        });

        onValue(gameRef, (snap) => {
            if (!snap.exists()) reiniciar();
        }, { onlyOnce: true });

    } else {
        // 6. MODO IA (OFFLINE)
        const ladoIA = (meuLado === 'vermelho') ? 'p' : 'v';
        const campoIA = document.getElementById('input-nome-' + ladoIA);
        if (campoIA) campoIA.value = "Máquina 🤖";
        reiniciar();
    }

    // 7. FINALIZAÇÃO VISUAL E GATILHO INICIAL IA
    document.getElementById('modal-cadastro').style.display = 'none';
    const selecaoLado = document.getElementById('selecao-lado-container');
    if (selecaoLado) selecaoLado.style.display = 'none';

    desenhar();
    console.log(`Cadastro confirmado: ${nomeDigitado} (${meuLado})`);

    // --- ALTERAÇÃO ESSENCIAL: Dispara IA se ela começar o jogo ---
    if (modoJogo === 'ia') {
        const idTurnoIA = (meuLado === 'vermelho' ? 2 : 1);
        if (turno === idTurnoIA) {
            console.log("Turno inicial é da IA. Iniciando jogada...");
            setTimeout(() => {
                jogadaDaIA();
            }, 1000); // Pausa de 1s para o jogador ver o tabuleiro primeiro
        }
    }
};

// 1. MONITOR DE NOMES COM TRAVA DE ESTABILIDADE
onValue(ref(db, 'partida_unica/nomes'), (snap) => {
    if (modoJogo !== 'online') return;
    
    const nomesAtuais = snap.val() || {};

    // --- VERIFICA QUEM SAIU (com atraso para evitar falsos positivos) ---
    Object.keys(nomesAnteriores).forEach(lado => {
        // Se o nome existia e agora sumiu, e NÃO é o meu próprio lado
        if (nomesAnteriores[lado] && !nomesAtuais[lado] && lado !== meuLado) {
            const nomeQueSumiu = nomesAnteriores[lado];
            const ladoQueSumiu = lado;

            // Se já houver um temporizador para este lado, limpa antes de criar outro
            if (temporizadoresSaida[ladoQueSumiu]) clearTimeout(temporizadoresSaida[ladoQueSumiu]);

            // Aguarda 2 segundos antes de disparar o alerta
            temporizadoresSaida[ladoQueSumiu] = setTimeout(() => {
                exibirAlertaSaida(nomeQueSumiu);
                
                // Para o jogo e limpa o placar do oponente que saiu
                jogoIniciado = false;
                const idCampoOponente = (ladoQueSumiu === 'vermelho') ? 'input-nome-v' : 'input-nome-p';
                const campo = document.getElementById(idCampoOponente);
                if (campo) campo.value = "Aguardando...";
                
                delete temporizadoresSaida[ladoQueSumiu];
            }, 2000); 
        }
    });

    // --- VERIFICA QUEM VOLTOU (Reconexão rápida ou troca de turno) ---
    Object.keys(nomesAtuais).forEach(lado => {
        // Se o nome reapareceu antes dos 2 segundos, cancela o alerta de saída
        if (temporizadoresSaida[lado]) {
            clearTimeout(temporizadoresSaida[lado]);
            delete temporizadoresSaida[lado];
            console.log(`Jogador ${nomesAtuais[lado]} estabilizou conexão.`);
        }

        // Atualiza os nomes nos inputs do placar em tempo real
        const idCampo = (lado === 'vermelho') ? 'input-nome-v' : 'input-nome-p';
        const campo = document.getElementById(idCampo);
        if (campo && nomesAtuais[lado]) {
            campo.value = nomesAtuais[lado];
        }
    });

    // Atualiza a lista de referência para a próxima comparação
    nomesAnteriores = { ...nomesAtuais };
});

// 2. MONITOR DE CONEXÃO GLOBAL
const connectedRef = ref(db, ".info/connected");
onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        console.log("🟢 Conectado ao servidor de jogo");
    } else {
        console.warn("🟡 Conexão com o servidor oscilando...");
    }
});

// 3. FUNÇÃO DE ALERTA (Visual de 3 segundos)
function exibirAlertaSaida(nome) {
    const alerta = document.createElement('div');
    alerta.className = 'feedback-saida';
    alerta.innerHTML = `<span>👋</span> Jogador <b>${nome}</b> saiu da sala!`;
    document.body.appendChild(alerta);

    // Fica visível por 3 segundos
    setTimeout(() => {
        alerta.style.opacity = '0';
        alerta.style.transform = 'translate(-50%, -20px)';
        setTimeout(() => alerta.remove(), 1000); // Tempo da transição CSS
    }, 3000);
}

function exibirAlertaSaida(nome) {
    const alerta = document.createElement('div');
    alerta.className = 'feedback-saida'; // Vamos criar o CSS para isso
    alerta.innerHTML = `<span>⚠️</span> O jogador <b>${nome}</b> saiu da sala!`;
    
    document.body.appendChild(alerta);

    // Remove o alerta após 4 segundos
    setTimeout(() => {
        alerta.style.opacity = '0';
        alerta.style.transform = 'translateY(-20px)';
        setTimeout(() => alerta.remove(), 1000);
    }, 4000);

    // Opcional: Pausar o jogo ou avisar que o oponente saiu
    jogoIniciado = false;
}

window.validarCliqueAvatar = (ladoClicado) => {
    // Se estiver no modo Online
    if (modoJogo === 'online') {
        // Só permite abrir se o lado que eu cliquei for o MEU lado escolhido
        if (ladoClicado === meuLado) {
            document.getElementById(`input-${ladoClicado}`).click();
        } else {
            console.warn("Você não pode alterar a foto do seu oponente!");
        }
    } else {
        // No modo IA (Offline), você pode alterar qualquer um dos dois se desejar
        // Ou trave apenas para o seu lado se preferir:
        if (ladoClicado === meuLado) {
            document.getElementById(`input-${ladoClicado}`).click();
        }
    }
};

window.salvarNoFirebase = () => {
    if (modoJogo !== 'online') return;
    set(gameRef, { mapa, turno, capturasV, capturasP, ts: Date.now() });
};

window.reiniciar = () => {
    // 1. Resetar variáveis de estado
    mapa = [
        [0, 2, 0, 2, 0, 2, 0, 2], 
        [2, 0, 2, 0, 2, 0, 2, 0], 
        [0, 2, 0, 2, 0, 2, 0, 2],
        [0, 0, 0, 0, 0, 0, 0, 0], 
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 1, 0, 1, 0, 1, 0], 
        [0, 1, 0, 1, 0, 1, 0, 1], 
        [1, 0, 1, 0, 1, 0, 1, 0]
    ];
    turno = 1; 
    capturasV = 0; 
    capturasP = 0; 
    selecionada = null;

    // 2. Limpar UI e Modais
    const telaVitoria = document.getElementById('tela-vitoria');
    if (telaVitoria) {
        telaVitoria.classList.remove('ativo');
        telaVitoria.style.display = 'none'; // Garante que o display reset
    }

    // 3. Atualizar o tabuleiro e placares
    desenhar();
    atualizarUI();

    // 4. Sincronizar se estiver online
    if (modoJogo === 'online') {
        window.salvarNoFirebase();
    }
};

function desenhar() {
    tabElement.innerHTML = '';
    
    // Agora a inversão acontece sempre que você escolher o lado preto, 
    // seja jogando Online ou contra a Máquina (IA).
    const inverter = (meuLado === 'preto');

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            // Se inverter for true, as coordenadas visuais (i, j) 
            // mapeiam para as coordenadas lógicas (r, c) invertidas.
            const r = inverter ? 7 - i : i;
            const c = inverter ? 7 - j : j;

            const casa = document.createElement('div');
            casa.className = `casa ${(r + c) % 2 === 0 ? 'branca' : 'preta'}`;
            casa.onclick = () => clicar(r, c);

            const valor = mapa[r][c];
            if (valor !== 0) {
                const peca = document.createElement('div');
                peca.className = `peca ${valor % 2 !== 0 ? 'peca-vermelha' : 'peca-preta'} ${valor > 2 ? 'dama' : ''}`;
                
                // Mantém o destaque da peça selecionada
                if (selecionada && selecionada.r === r && selecionada.c === c) {
                    peca.classList.add('selecionada');
                }
                casa.appendChild(peca);
            }
            tabElement.appendChild(casa);
        }
    }
    atualizarUI();
}

function atualizarDestaqueTurno() {
    const boxV = document.getElementById('box-vermelho');
    const boxP = document.getElementById('box-preto');

    if (turno === 1) {
        boxV.classList.add('sua-vez');
        boxP.classList.remove('sua-vez');
    } else {
        boxP.classList.add('sua-vez');
        boxV.classList.remove('sua-vez');
    }
}

// Função para disparar o efeito visual do emoji
function dispararEfeitoEmoji(emoji, lado) {
    const cardId = lado === 'vermelho' ? 'box-vermelho' : 'box-preto';
    const cardElement = document.getElementById(cardId);
    
    if (!cardElement) return;

    // Cria o elemento do emoji
    const emojiElement = document.createElement('div');
    emojiElement.className = 'floating-emoji';
    emojiElement.innerText = emoji;

    // Pega a posição do card para saber de onde o emoji sai
    const rect = cardElement.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2) - 20; // Ajuste para centralizar
    const centerY = rect.top;

    emojiElement.style.left = `${centerX}px`;
    emojiElement.style.top = `${centerY}px`;

    document.body.appendChild(emojiElement);

    // Remove o elemento da memória depois que a animação termina
    setTimeout(() => {
        emojiElement.remove();
    }, 2500);
}

window.enviarEmoji = function(emoji) {
    // 1. FECHA O MODAL IMEDIATAMENTE (Tenta por ID e por Classe)
    const modalEmoji = document.getElementById('modal-emoji-selecao');
    if (modalEmoji) {
        modalEmoji.style.display = 'none'; // Garante o fechamento visual
        modalEmoji.classList.remove('active'); // Remove classe em inglês
        modalEmoji.classList.remove('ativo');  // Remove classe em português
        modalEmoji.classList.remove('show');   // Por segurança
    }

    // 2. EFEITO VISUAL (O emoji subindo no tabuleiro)
    if (typeof dispararEfeitoEmoji === 'function') {
        dispararEfeitoEmoji(emoji, meuLado);
    }

    // 3. LÓGICA DE ENVIO
    if (modoJogo === 'online') {
        // Usando os nomes de campos que o seu Firebase está esperando
        set(emojiRef, { 
            emoji: emoji, 
            lado: meuLado, 
            timestamp: Date.now() 
        });
    }
};

function atualizarUI() {
    document.getElementById('capturas-v').innerText = capturasV;
    document.getElementById('capturas-p').innerText = capturasP;
    document.getElementById('box-vermelho').classList.toggle('turno-ativo-vermelho', turno === 1);
    document.getElementById('box-preto').classList.toggle('turno-ativo-preto', turno === 2);
}

function clicar(r, c) {
    if (modoJogo === 'online') {
        const meuLadoNormalizado = meuLado ? meuLado.toLowerCase() : "";
        const meuTurnoID = (meuLadoNormalizado === 'vermelho' ? 1 : 2);
        
        // Bloqueio de Turno
        if (turno !== meuTurnoID) {
            console.log("Não é sua vez! Turno no Firebase:", turno);
            return;
        }
        
        // Trava de Jogo Iniciado
        if (!jogoIniciado) {
            console.warn("Aguardando oponente...");
            return;
        }
    }

    const valor = mapa[r][c];
    
    // --- CORREÇÃO DA LÓGICA DE SELEÇÃO ---
    // Se turno é 1 (Ímpar), procura peças 1 ou 3 (Ímpares)
    // Se turno é 2 (Par), procura peças 2 ou 4 (Pares)
    const ehVezDoVermelho = (turno === 1 && (valor === 1 || valor === 3));
    const ehVezDoPreto = (turno === 2 && (valor === 2 || valor === 4));

    if (ehVezDoVermelho || ehVezDoPreto) {
        const todasAsJogadas = obterTodosMvs(mapa, turno);
        const capturasObrigatorias = todasAsJogadas.filter(m => m.cap);

        if (capturasObrigatorias.length > 0) {
            const estaPecaPodeComer = capturasObrigatorias.some(m => m.de.r === r && m.de.c === c);
            if (!estaPecaPodeComer) {
                if (typeof window.mostrarAvisoCaptura === 'function') window.mostrarAvisoCaptura();
                return; 
            }
        }

        selecionada = { r, c };
        desenhar(); 
        console.log("Peça selecionada:", selecionada);
    } 
    else if (selecionada && valor === 0) {
        validarEMover(r, c);
    }
}

// Auxiliar para detectar se há capturas disponíveis para uma peça específica (Combo)
function buscarCapturasDisponiveis(r, c, j) {
    let capturas = [];
    const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    dirs.forEach(([dr, dc]) => {
        let nr = r + dr*2, nc = c + dc*2;
        let mr = r + dr, mc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && mapa[nr][nc] === 0) {
            if (mapa[mr][mc] !== 0 && mapa[mr][mc] % 2 !== j % 2) {
                capturas.push({r: nr, c: nc});
            }
        }
    });
    return capturas;
}

window.mostrarAvisoCaptura = function() {
    // Turno 1 = Vermelho (box-vermelho), Turno 2 = Preto (box-preto)
    const idPlacar = (turno === 1) ? 'box-vermelho' : 'box-preto';
    const placar = document.getElementById(idPlacar);

    if (placar) {
        // Remove avisos duplicados
        const antigos = placar.querySelectorAll('.feedback-erro');
        antigos.forEach(a => a.remove());

        const aviso = document.createElement('div');
        aviso.className = 'feedback-erro';
        aviso.innerHTML = 'Coma a peça!';

        // Efeito de tremor no placar
        placar.classList.add('shake-placar');
        setTimeout(() => placar.classList.remove('shake-placar'), 500);

        placar.appendChild(aviso);
        setTimeout(() => aviso.remove(), 2500);
    }
};

function validarEMover(r, c) {
    if (modoJogo === 'online' && !jogoIniciado) {
        if (typeof window.exibirFeedback === 'function') {
            window.exibirFeedback("Aguardando oponente para começar...", "erro");
        }
        return;
    }

    const todasAsJogadas = obterTodosMvs(mapa, turno);
    const temCapturaNoTabuleiro = todasAsJogadas.some(m => m.cap);

    const movValido = todasAsJogadas.find(m => 
        m.de.r === selecionada.r && 
        m.de.c === selecionada.c && 
        m.para.r === r && 
        m.para.c === c
    );

    if (!movValido) return;

    if (temCapturaNoTabuleiro && !movValido.cap) {
        if (typeof window.mostrarAvisoCaptura === 'function') {
            window.mostrarAvisoCaptura();
        }
        return; 
    }

    // --- EXECUÇÃO DO MOVIMENTO ---
    if (movValido.cap) {
        const rCap = movValido.cap.r;
        const cCap = movValido.cap.c;
        const valorPecaComida = mapa[rCap][cCap];

        if (typeof animarPecaParaPlacar === 'function') {
            animarPecaParaPlacar(rCap, cCap, valorPecaComida);
        }
        
        mapa[rCap][cCap] = 0; 
        if (turno === 1) capturasV++; else capturasP++;
        tocarSom('cap');
    } else {
        tocarSom('move');
    }

    const pecaValor = mapa[selecionada.r][selecionada.c];
    let pecaFinal = pecaValor;

    if ((turno === 1 && r === 0) || (turno === 2 && r === 7)) {
        if (pecaValor <= 2) pecaFinal = (turno === 1 ? 3 : 4);
    }
    
    mapa[r][c] = pecaFinal;
    mapa[selecionada.r][selecionada.c] = 0;

    // --- LÓGICA DE CONTINUIDADE ---
    const novasJogadas = obterTodosMvs(mapa, turno);
    const temMais = movValido.cap && novasJogadas.some(m => 
        m.de.r === r && 
        m.de.c === c && 
        m.cap
    );

    if (temMais) {
        selecionada = { r, c }; 
    } else {
        selecionada = null;
        turno = (turno === 1 ? 2 : 1); 
        
        if (typeof verificarFimDeJogo === 'function') verificarFimDeJogo();
    }

    // ATUALIZAÇÃO VISUAL LOCAL (Antes do Firebase)
    desenhar(); 
    if (typeof atualizarDestaqueTurno === 'function') atualizarDestaqueTurno();
    if (typeof atualizarUI === 'function') atualizarUI();

    // SINCRONIZAÇÃO EXTERNA
    if (modoJogo === 'online') {
        if (typeof window.salvarNoFirebase === 'function') {
            window.salvarNoFirebase();
        }
    } else if (modoJogo === 'ia' && !temMais && turno !== meuLado) {
        setTimeout(jogadaDaIA, 600);
    }
}

// --- FUNÇÃO AUXILIAR DE ANIMAÇÃO CORRIGIDA ---
function animarPecaParaPlacar(r, c, tipoPecaComida) {
    const casas = document.querySelectorAll('.casa');
    
    // 1. Ajuste para tabuleiro invertido (meuLado === 'preto')
    const inverter = (typeof meuLado !== 'undefined' && meuLado === 'preto');
    const rVisual = inverter ? 7 - r : r;
    const cVisual = inverter ? 7 - c : c;
    const index = rVisual * 8 + cVisual;
    
    const casaOrigem = casas[index];
    if (!casaOrigem) return;

    const rectOrigem = casaOrigem.getBoundingClientRect();
    
    // 2. Define o destino baseado em quem capturou
    // Se a peça comida era PRETA (2 ou 4), ela voa para o placar VERMELHO (quem capturou)
    const ehPreta = (tipoPecaComida === 2 || tipoPecaComida === 4);
    const destinoId = ehPreta ? 'box-vermelho' : 'box-preto';
    const placarDestino = document.getElementById(destinoId);
    if (!placarDestino) return;

    const rectDestino = placarDestino.getBoundingClientRect();

    // 3. Criar elemento visual temporário (peça fantasma)
    const pecaVoadora = document.createElement('div');
    // Usa peca-voadora para o CSS específico e peca-cor para o estilo
    pecaVoadora.className = `peca-voadora ${ehPreta ? 'peca-preta' : 'peca-vermelha'}`;
    
    // Posição inicial (Centro da casa de origem)
    pecaVoadora.style.left = `${rectOrigem.left + rectOrigem.width / 2 - 20}px`;
    pecaVoadora.style.top = `${rectOrigem.top + rectOrigem.height / 2 - 20}px`;

    document.body.appendChild(pecaVoadora);

    // 4. O SEGREDO: Delay mínimo para o navegador registrar a posição inicial
    // Sem esse timeout, a peça já "nasce" no destino
    setTimeout(() => {
        pecaVoadora.style.left = `${rectDestino.left + rectDestino.width / 2 - 20}px`;
        pecaVoadora.style.top = `${rectDestino.top + rectDestino.height / 2 - 20}px`;
        pecaVoadora.style.transform = 'scale(0.4) rotate(180deg)'; // Gira e diminui
        pecaVoadora.style.opacity = '0.6';
    }, 20); 

    // 5. Finalização: Remove a peça e faz o placar pulsar
    setTimeout(() => {
        pecaVoadora.remove();
        
        // Efeito de pulsação no placar de destino
        placarDestino.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        placarDestino.style.transform = 'scale(1.15)';
        
        setTimeout(() => {
            placarDestino.style.transform = 'scale(1)';
        }, 200);
    }, 820); // 820ms para casar com a transição de 0.8s
}

// --- IA AVANÇADA CORRIGIDA (SEM ERRO DE COMBO) ---
async function jogadaDaIA() {
    const turnoIA = (meuLado === 'vermelho' ? 2 : 1);
    
    if (turno !== turnoIA || modoJogo !== 'ia') return;

    const idPlacar = (turnoIA === 1) ? 'box-vermelho' : 'box-preto';
    const placarIA = document.getElementById(idPlacar);
    const labelStatus = placarIA.querySelector('.count-label');
    const statusOriginal = "Vermelho"; // Ou o texto padrão que você usa

    labelStatus.innerText = "Maquina pensando...";

    await new Promise(r => setTimeout(r, 1200));

    const mvs = obterTodosMvs(mapa, turno);
    
    if (mvs.length > 0) {
        let jogadaEscolhida;
        const capturas = mvs.filter(m => m.cap);
        
        if (capturas.length > 0) {
            jogadaEscolhida = capturas.reduce((melhor, atual) => {
                const nCapAtual = atual.totalCapturas || 1;
                const nCapMelhor = melhor.totalCapturas || 1;
                return (nCapAtual > nCapMelhor) ? atual : melhor;
            }, capturas[0]);
        } else {
            const jogadasSeguras = mvs.filter(m => !verificarSeSeraCapturada(m.para.r, m.para.c));
            if (jogadasSeguras.length > 0) {
                if (turnoIA === 1) {
                    jogadaEscolhida = jogadasSeguras.sort((a, b) => a.para.r - b.para.r)[0];
                } else {
                    jogadaEscolhida = jogadasSeguras.sort((a, b) => b.para.r - a.para.r)[0];
                }
            } else {
                jogadaEscolhida = mvs[Math.floor(Math.random() * mvs.length)];
            }
        }

        if (jogadaEscolhida) {
            const rDestino = jogadaEscolhida.para.r;
            const cDestino = jogadaEscolhida.para.c;
            
            selecionada = jogadaEscolhida.de;
            validarEMover(rDestino, cDestino);
            desenhar();

            // --- LÓGICA DE COMBO CORRIGIDA ---
            // Verificamos se, após mover, a mesma peça AINDA pode capturar mais alguém
            const novasJogadas = obterTodosMvs(mapa, turno);
            const podeContinuarComendo = novasJogadas.some(m => 
                m.de.r === rDestino && m.de.c === cDestino && m.cap
            );

            if (turno === turnoIA && podeContinuarComendo) {
                labelStatus.innerText = "Continuando combo...";
                setTimeout(() => jogadaDaIA(), 800);
                return; // Mantém a função rodando para o combo
            }
        }
    }

    // Se chegou aqui, a vez da IA acabou de verdade
    labelStatus.innerText = statusOriginal;
}

// Função auxiliar para a IA não ser "burra" e entregar peças
function verificarSeSeraCapturada(r, c) {
    const oponenteTurno = (turno === 1 ? 2 : 1);
    // Simula se na posição (r,c) o oponente teria uma captura imediata
    const mvsOponente = obterTodosMvs(mapa, oponenteTurno);
    return mvsOponente.some(m => m.cap && m.cap.r === r && m.cap.c === c);
}

function verificarFimDeJogo() {
    let temVermelho = false;
    let temPreto = false;

    // Percorre o mapa procurando peças
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (mapa[r][c] === 1 || mapa[r][c] === 3) temVermelho = true;
            if (mapa[r][c] === 2 || mapa[r][c] === 4) temPreto = true;
        }
    }

    // Se um dos lados não tem mais peças ou não tem movimentos (opcional)
    if (!temVermelho || !temPreto) {
        exibirModalVitoria(temVermelho ? "VERMELHO" : "PRETO");
    }
}

function exibirModalVitoria(vencedor) {
    const tela = document.getElementById('tela-vitoria');
    const texto = document.getElementById('vencedor-texto');
    
    if (tela && texto) {
        texto.innerText = `VITÓRIA DO ${vencedor}!`;
        
        // Garante que o elemento se torne visível
        tela.style.display = 'flex'; 
        
        // Adiciona a classe para disparar as animações do seu CSS
        setTimeout(() => {
            tela.classList.add('ativo');
        }, 10);
    }
}

function obterTodosMvs(m, j) {
    let res = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const peca = m[r][c];
            if (peca !== 0 && peca % 2 === j % 2) {
                const ehDama = peca > 2;
                const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

                dirs.forEach(([dr, dc]) => {
                    if (ehDama) {
                        // LÓGICA DA DAMA (Pode andar várias casas)
                        let encontrouInimigo = false;
                        let rInimigo = -1, cInimigo = -1;

                        for (let i = 1; i < 8; i++) {
                            let nr = r + dr * i, nc = c + dc * i;
                            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

                            const alvo = m[nr][nc];
                            if (alvo === 0) {
                                if (!encontrouInimigo) {
                                    res.push({ de: { r, c }, para: { r: nr, c: nc } });
                                } else {
                                    // Captura à distância (depois de pular o inimigo)
                                    res.push({ de: { r, c }, para: { r: nr, c: nc }, cap: { r: rInimigo, c: cInimigo } });
                                }
                            } else if (alvo % 2 !== j % 2) {
                                if (encontrouInimigo) break; // Dois inimigos na linha: bloqueado
                                encontrouInimigo = true;
                                rInimigo = nr; cInimigo = nc;
                            } else {
                                break; // Peça amiga bloqueia
                            }
                        }
                    } else {
                        // LÓGICA PEÇA COMUM
                        let nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && m[nr][nc] === 0) {
                            if (!((j === 1 && dr > 0) || (j === 2 && dr < 0))) {
                                res.push({ de: { r, c }, para: { r: nr, c: nc } });
                            }
                        }
                        let cr = r + dr * 2, cc = c + dc * 2;
                        if (cr >= 0 && cr < 8 && cc >= 0 && cc < 8 && m[cr][cc] === 0) {
                            if (m[nr][nc] !== 0 && m[nr][nc] % 2 !== j % 2) {
                                res.push({ de: { r, c }, para: { r: cr, c: cc }, cap: { r: nr, c: nc } });
                            }
                        }
                    }
                });
            }
        }
    }
    return res;
}

reiniciar();