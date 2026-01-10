import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    onValue, 
    update,
    remove
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

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

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let meuNome = "";
// 1. PRIMEIRO: Definir todas as referências (o endereço dos dados)
const gameRef = ref(db, 'partida_unica');
const emojiRef = ref(db, 'partida_unica/ultimo_emoji');
const nomesRef = ref(db, 'partida_unica/nomes');
const playersRef = ref(db, 'partida_unica/jogadores'); // Criado antes de usar!

// Monitor de nomes
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
 //   atualizarIndicadoresStatus(jogadoresAtuais);

    if (jogadoresAtuais.vermelho && jogadoresAtuais.preto) {
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

// ✅ Função para exibir o alerta visual de entrada
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
/* function atualizarIndicadoresStatus(jogadores) {
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


*/


// ✅ Monitor do estado do Tabuleiro (Sincroniza apenas as peças e o turno)
onValue(gameRef, (snapshot) => {
    if (modoJogo !== 'online') return;
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    
    if (!data || !data.mapa) return;
    if (selecionada !== null) return;

    mapa = data.mapa;
    turno = data.turno;
    capturasV = data.capturasV || 0;
    capturasP = data.capturasP || 0;
    
    desenhar();
    
    if (typeof atualizarUI === 'function') atualizarUI();
    if (typeof atualizarDestaqueTurno === 'function') atualizarDestaqueTurno();
});

// Referência para o vencedor no banco
const vencedorRef = ref(db, 'partida_unica/vencedor');

onValue(vencedorRef, (snap) => {
    const vencedorId = snap.val();
    
    // 1. Se existe um vencedor gravado no banco de dados
    if (vencedorId) {
        if (meuLado === vencedorId) {
            exibirModalVitoria(vencedorId.toUpperCase());
        } 
        else {
            exibirModalDerrota();
        }
    } 
    // 2. MELHORIA: Se o vencedorId for nulo (vazio), limpa a tela de quem ficou
    else {
        const telaV = document.getElementById('tela-vitoria');
        const telaD = document.getElementById('tela-derrota');
        
        // Esconde o modal de vitória se ele estiver aberto
        if (telaV) {
            telaV.classList.remove('ativo');
            telaV.style.display = 'none';
        }
        // Esconde o modal de derrota se ele estiver aberto
        if (telaD) {
            telaD.classList.remove('ativo');
            telaD.style.display = 'none';
        }
           
    }
});

// --- VARIÁVEIS GLOBAIS ---
let jogoIniciado = false;
let partidaConfirmada = false;
let monitoresIniciados = false;
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

// ---✅ SISTEMA DE FOTOS DO PLACAR (ATÉ 2MB COM COMPRESSÃO) ---
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

                const base64Comprimida = canvas.toDataURL('image/jpeg', 0.7);
                const imgElement = document.getElementById(imgId);
                const iconElement = document.getElementById(iconId);

                if (imgElement) {
                    imgElement.src = base64Comprimida;
                    imgElement.style.display = 'block';
                }
                if (iconElement) {
                    iconElement.style.display = 'none';
                }

                if (typeof modoJogo !== 'undefined' && modoJogo === 'online') {
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

// ✅ emojis

function exibirEmojiNaTela(emoji, lado) {
    const el = document.createElement('div');
    el.className = 'float-emoji';
    el.innerText = emoji;

    // Aplicamos a animação baseada no lado de quem enviou
    // Se for o jogador de baixo (vermelho), o emoji SOBE para o centro
    // Se for o jogador de cima (preto), o emoji DESCE para o centro
    if (lado === 'vermelho') {
        el.classList.add('animar-subir');
    } else {
        el.classList.add('animar-descer');
    }

    document.body.appendChild(el);

    // Remove do HTML após a animação acabar
    setTimeout(() => {
        el.remove();
    }, 2000);
}

// --- OUVINTE ÚNICO DE EMOJIS ---
onValue(emojiRef, (snap) => {
    const data = snap.val();
    
    if (data && data.ts && (Date.now() - data.ts < 3000)) {
        
        exibirEmojiNaTela(data.texto, data.lado);
        
        if (typeof dispararEfeitoEmoji === 'function') {
            dispararEfeitoEmoji(data.texto, data.lado);
        }
    }
});

// --- LÓGICA DO JOGO ---
window.selecionarModoCard = (modo) => {
    const nomeInput = document.getElementById('modal-input-nome');
    const nome = nomeInput ? nomeInput.value.trim() : "";
    
    // Validação Profissional: Não deixa escolher o modo sem o nome
    if (nome.length < 3) {
        const erro = document.getElementById('nome-error');
        if (erro) erro.innerText = "Digite seu nome (mínimo 3 letras)";
        nomeInput.style.borderColor = "#ff5f6d";
        return;
    }

    // Limpa erros
    const erroLabel = document.getElementById('nome-error');
    if (erroLabel) erroLabel.innerText = "";
    nomeInput.style.borderColor = "#333";

    // Define o modo globalmente
    modoJogo = modo;

    // Feedback visual nos cards
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    const cardAtivo = document.getElementById(`card-${modo}`);
    if (cardAtivo) cardAtivo.classList.add('selected');

    // --- ATIVAÇÃO DO MONITORAMENTO SE FOR ONLINE ---

if (modo === 'online') {
    console.log("🌐 Modo Online selecionado. Ativando monitoramentos...");

    if (typeof iniciarMonitoramentoOnline === 'function') {
        iniciarMonitoramentoOnline();
    }

    if (typeof iniciarMonitoramentoFotos === 'function') {
        iniciarMonitoramentoFotos();
    }
    monitoresIniciados = true;
}

    // Mostra a escolha de lados com animação
    const sideSelection = document.getElementById('side-selection');
    if (sideSelection) {
        sideSelection.style.display = 'block';
        sideSelection.style.animation = 'fadeIn 0.5s ease';
    }
};






















window.confirmarCadastro = (ladoEscolhido) => {
    const nomeInput = document.getElementById('modal-input-nome');
    const nomeDigitado = nomeInput ? nomeInput.value.trim() : "";

    if (nomeDigitado === "") {
        alert("Por favor, digite seu nome!");
        return;
    }

    // 1. ATUALIZAÇÃO DA VARIÁVEL GLOBAL
    meuLado = ladoEscolhido;
    meuNome = nomeDigitado; 
    mostrarMeuBotaoSair(); 

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
        // --- REGISTRAR PRESENÇA ONLINE ---
        // Isso faz com que o oponente consiga te ver
        const minhaPresencaRef = ref(db, `usuarios_online/${nomeDigitado}`);
        set(minhaPresencaRef, { online: true, nome: nomeDigitado });

        // 4. REFERÊNCIAS E SALVAMENTO NO FIREBASE (DADOS DA PARTIDA)
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
            pkg.onDisconnect(minhaPresencaRef).remove(); // Remove você da lista online ao fechar
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

    // 7. FINALIZAÇÃO VISUAL
    const modal = document.getElementById('modal-cadastro');
    if (modal) modal.style.display = 'none';
    
    const selecaoLado = document.getElementById('side-selection'); // Ajustado para o ID do seu HTML
    if (selecaoLado) selecaoLado.style.display = 'none';

    desenhar();

    if (modoJogo === 'ia') {
        const idTurnoIA = (meuLado === 'vermelho' ? 2 : 1);
        if (turno === idTurnoIA) {
            setTimeout(() => {
                if (typeof jogadaDaIA === 'function') jogadaDaIA();
            }, 1000); 
        }
    }
};

















function mostrarMeuBotaoSair() {
    // Remove qualquer botão de sair existente para evitar duplicatas
    const botoesAntigos = document.querySelectorAll('.btn-sair');
    botoesAntigos.forEach(b => b.remove());

    // Define qual é a MINHA caixa de placar
    const idMinhaCaixa = (meuLado === 'vermelho') ? 'box-vermelho' : 'box-preto';
    const container = document.getElementById(idMinhaCaixa);

    if (container) {
        const btn = document.createElement('button');
        btn.className = 'btn-sair';
        btn.innerText = 'Sair';
        
        // Chama a função de sair que exclui o Firebase
        btn.onclick = () => window.sairDoJogo(); 
        
        container.appendChild(btn);
    }
}

// --- ✅ MONITORAMENTO

function iniciarMonitoramentoFotos() {
    if (modoJogo !== 'online') return;

    onValue(ref(db, 'partida_unica/fotos'), (snap) => {
        const fotos = snap.val() || {};

        // 🔴 FOTO DO VERMELHO
        if (fotos.vermelho) {
            const imgV = document.getElementById('foto-vermelho');
            const iconV = document.getElementById('icon-vermelho');

            if (imgV) {
                imgV.src = fotos.vermelho;
                imgV.style.display = 'block';
            }
            if (iconV) iconV.style.display = 'none';
        }

        // ⚫ FOTO DO PRETO
        if (fotos.preto) {
            const imgP = document.getElementById('foto-preto');
            const iconP = document.getElementById('icon-preto');

            if (imgP) {
                imgP.src = fotos.preto;
                imgP.style.display = 'block';
            }
            if (iconP) iconP.style.display = 'none';
        }
    });
}

// --- ✅ MONITORAMENTO ONLINE COMPLETO (NOMES, TABULEIRO, FOTOS E ESTABILIDADE) ---
// --- ✅ MONITORAMENTO ONLINE COMPLETO (NOMES, TABULEIRO, FOTOS E ESTABILIDADE) ---
function iniciarMonitoramentoOnline() {
    if (modoJogo !== 'online') return;

    // 1. MONITOR DE NOMES E ESTADO DA SALA (GERENCIA SAÍDAS E ENTRADAS)
    onValue(ref(db, 'partida_unica/nomes'), (snap) => {
        if (modoJogo !== 'online') return;

        const nomesAtuais = snap.val() || {};

        // ✅ GATILHO DE LIBERAÇÃO CRÍTICO
        if (nomesAtuais.vermelho && nomesAtuais.preto) {
            console.log("🎮 Partida Pronta! Ambos os jogadores estão online.");
            jogoIniciado = true;      
            partidaConfirmada = true; 
        }

        // 🟢 LÓGICA DE ATUALIZAÇÃO DE NOMES
        Object.keys(nomesAtuais).forEach(lado => {
            if (temporizadoresSaida[lado]) {
                clearTimeout(temporizadoresSaida[lado]);
                delete temporizadoresSaida[lado];
            }
            const idCampo = (lado === 'vermelho') ? 'input-nome-v' : 'input-nome-p';
            const campo = document.getElementById(idCampo);
            if (campo && nomesAtuais[lado]) {
                campo.value = nomesAtuais[lado];
            }
        });

        // 🔥 NOVO GATILHO: ATUALIZAÇÃO DAS BOLINHAS DE STATUS
        // Quando os nomes da partida carregam, forçamos a busca na lista global de presença
        import("https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js").then(pkg => {
            const presenceRef = pkg.ref(db, 'usuarios_online');
            pkg.get(presenceRef).then((snapshotOnline) => {
                if (typeof atualizarBolinhasStatus === 'function') {
                    atualizarBolinhasStatus(snapshotOnline.val());
                }
            });
        });

        // 🔴 LÓGICA DE SAÍDA REAL (DISPARA SE O NOME SUMIR DO BANCO)
        Object.keys(nomesAnteriores).forEach(lado => {
            const existiaAntes = nomesAnteriores[lado];
            const naoExisteAgora = !nomesAtuais[lado];
            const naoSouEu = lado !== meuLado;

            if (existiaAntes && naoExisteAgora && naoSouEu) {
                const nomeQueSumiu = nomesAnteriores[lado];
                const ladoQueSumiu = lado;

                if (temporizadoresSaida[ladoQueSumiu]) clearTimeout(temporizadoresSaida[ladoQueSumiu]);

                temporizadoresSaida[ladoQueSumiu] = setTimeout(() => {
                    if (!nomesAtuais[ladoQueSumiu]) {
                        if (typeof exibirAlertaSaida === 'function') exibirAlertaSaida(nomeQueSumiu);
                        
                        if (partidaConfirmada) {
                            setTimeout(() => window.location.reload(), 3000);
                        } else {
                            jogoIniciado = false;
                        }

                        const idCampoOponente = (ladoQueSumiu === 'vermelho') ? 'input-nome-v' : 'input-nome-p';
                        const campo = document.getElementById(idCampoOponente);
                        if (campo) campo.value = "Aguardando...";
                        
                        // Esconde a bolinha se o oponente saiu
                        const dotId = (ladoQueSumiu === 'vermelho') ? 'status-v' : 'status-p';
                        const dot = document.getElementById(dotId);
                        if (dot) dot.style.display = "none";
                    }
                    delete temporizadoresSaida[ladoQueSumiu];
                }, 2000);
            }
        });

        nomesAnteriores = { ...nomesAtuais };
    });
       
    // 2. MONITOR DE SINCRONIZAÇÃO DO TABULEIRO (SOMENTE MOVIMENTOS)
    onValue(ref(db, 'partida_unica'), (snapshot) => {
        if (modoJogo !== 'online' || !snapshot.exists()) return;
        
        const data = snapshot.val();
        if (!data || !data.mapa) return;
        if (selecionada !== null) return;

        mapa = data.mapa;
        turno = data.turno;
        capturasV = data.capturasV || 0;
        capturasP = data.capturasP || 0;
        
        if (typeof desenhar === 'function') desenhar();
        console.log("🔄 Tabuleiro sincronizado via rede.");
    });

    // 3. SINCRONIZAÇÃO DE FOTOS
    onValue(ref(db, 'partida_unica/fotos'), (snap) => {
        if (modoJogo !== 'online') return;
        const fotos = snap.val() || {};

        const lados = ['vermelho', 'preto'];
        lados.forEach(l => {
            if (fotos[l]) {
                const idImg = (l === 'vermelho') ? 'img-vermelho' : 'img-preto'; 
                const idIcon = (l === 'vermelho') ? 'icon-v' : 'icon-p';
                
                const imgElement = document.getElementById(idImg);
                const iconElement = document.getElementById(idIcon);

                if (imgElement && imgElement.src !== fotos[l]) {
                    imgElement.src = fotos[l];
                    imgElement.style.display = 'block';
                    if (iconElement) iconElement.style.display = 'none';
                }
            }
        });
    });

    // 4. MONITOR DE STATUS DA CONEXÃO GLOBAL
    onValue(ref(db, ".info/connected"), (snap) => {
        console.log(snap.val() === true ? "🟢 Servidor Conectado" : "🟡 Conexão Oscilando");
    });
}












            
// --- CONFIGURAÇÃO DE PRESENÇA E STATUS ONLINE ---

// --- SISTEMA DE STATUS ONLINE (VERSÃO FINAL PARA PWA/MOBILE) ---

const listaJogadoresRef = ref(db, 'usuarios_online');

// Função central de atualização de bolinhas
const atualizarBolinhasStatus = (jogadoresOnline) => {
    if (!jogadoresOnline) return;

    // 1. Pegamos os nomes, removemos espaços e deixamos tudo em minúsculo
    const nomeV = document.getElementById('input-nome-v')?.value?.trim().toLowerCase();
    const nomeP = document.getElementById('input-nome-p')?.value?.trim().toLowerCase();
    
    const dotV = document.getElementById('status-v');
    const dotP = document.getElementById('status-p');

    // 2. Criamos um conjunto de chaves online (também normalizadas)
    const chavesOnline = Object.keys(jogadoresOnline);

    // LÓGICA VERMELHO (Quem vê é o Preto)
    if (dotV) {
        if (meuLado === 'preto' && nomeV && chavesOnline.includes(nomeV)) {
            dotV.style.display = "inline-block";
            dotV.classList.add('online');
        } else {
            dotV.style.display = "none";
            dotV.classList.remove('online');
        }
    }

    // LÓGICA PRETO (Quem vê é o Vermelho)
    if (dotP) {
        if (meuLado === 'vermelho' && nomeP && chavesOnline.includes(nomeP)) {
            dotP.style.display = "inline-block";
            dotP.classList.add('online');
        } else {
            dotP.style.display = "none";
            dotP.classList.remove('online');
        }
    }
};

// 1. Registrar presença (Garante compatibilidade com teclado de celular)
window.registrarPresenca = (nome) => {
    if (!nome) return;
    
    // Normaliza o nome antes de salvar no banco
    const nomeNormalizado = nome.trim().toLowerCase();
    const minhaPresencaRef = ref(db, `usuarios_online/${nomeNormalizado}`);
    
    set(minhaPresencaRef, { 
        online: true, 
        nomeExibicao: nome.trim(), // Nome original com maiúsculas para a lista lateral
        timestamp: Date.now() 
    });
    
    import("https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js").then(pkg => {
        pkg.onDisconnect(minhaPresencaRef).remove();
    });
};

// 2. Ouvinte principal do Firebase
onValue(listaJogadoresRef, (snapshot) => {
    const jogadoresOnline = snapshot.val() || {};
    atualizarBolinhasStatus(jogadoresOnline);

    // Atualiza lista lateral
    const listaUl = document.getElementById('lista-jogadores');
    if (listaUl) {
        listaUl.innerHTML = ""; 
        const meuNomeRef = meuNome ? meuNome.trim().toLowerCase() : "";
        for (let chave in jogadoresOnline) {
            if (chave === meuNomeRef) continue; 
            const dados = jogadoresOnline[chave];
            const li = document.createElement('li');
            li.className = 'jogador-item';
            li.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="status-dot online"></span>
                    <span>${dados.nomeExibicao || chave}</span>
                </div>
                <button class="btn-desafiar" onclick="desafiarJogador('${dados.nomeExibicao || chave}')">CONVIDAR</button>
            `;
            listaUl.appendChild(li);
        }
    }
});
// ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅



































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
    }, 4000);
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

window.salvarNoFirebase = (novoTurno = turno) => {

    if (modoJogo !== 'online') return;

    const meuTurnoID = (meuLado === 'vermelho') ? 1 : 2;

    // 🔒 Só quem acabou de jogar pode salvar
    if (turno !== meuTurnoID) {
        console.warn("Bloqueado: tentativa de salvar fora do turno");
        return;
    }

    set(gameRef, {
        mapa,
        turno: novoTurno,
        capturasV,
        capturasP,
        ts: Date.now()
    });

};

window.encerrarPartida = function() {
    // 1. Se for modo online, precisamos limpar o vencedor do banco
    if (modoJogo === 'online') {
        const vencedorRef = ref(db, 'partida_unica/vencedor');
        
        // Remove a informação do vencedor para que o modal não volte
        remove(vencedorRef).then(() => {
            // Só recarrega a página depois que o Firebase confirmar a exclusão
            window.location.reload();
        }).catch(() => {
            // Caso dê erro na rede, recarrega mesmo assim
            window.location.reload();
        });
    } else {
        // Se for contra a IA, basta recarregar
        window.location.reload();
    }
};

// 🟢 função reiniciar
 
window.reiniciar = () => {
    // 1. Restaurar o Tabuleiro (Mapa inicial)
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

    // 2. Resetar variáveis de estado
    turno = 1; 
    capturasV = 0; 
    capturasP = 0; 
    selecionada = null;
    jogoIniciado = true;

    // 3. Esconder Modais (Vitória e Derrota Profissional)
    const telaVitoria = document.getElementById('tela-vitoria');
    if (telaVitoria) {
        telaVitoria.classList.remove('ativo');
        telaVitoria.style.display = 'none'; 
    }
    
    const telaDerrota = document.getElementById('tela-derrota');
    if (telaDerrota) {
        telaDerrota.classList.remove('ativo');
        telaDerrota.style.display = 'none';
    }

    // 4. Atualizar a Interface do Usuário
    desenhar();
    if (typeof atualizarUI === 'function') atualizarUI();
    if (typeof atualizarDestaqueTurno === 'function') atualizarDestaqueTurno();

    // 5. Sincronizar Firebase (Modo Online)
    if (modoJogo === 'online') {
        // Apenas o jogador Vermelho (geralmente o mestre/criador) limpa os dados globais
        if (meuLado === 'vermelho') {
            // Remove o vencedor do banco para liberar a tela do oponente
            const vencedorRef = ref(db, 'partida_unica/vencedor');
            remove(vencedorRef);

            // Reseta o mapa e o turno para o oponente ver a mudança
            if (typeof window.salvarNoFirebase === 'function') {
                window.salvarNoFirebase(1); 
            }
        }
    }
    
    // 6. Lógica de Início para IA
    if (modoJogo === 'ia') {
        const turnoIA = (meuLado === 'vermelho') ? 2 : 1;
        
        // Se a IA for o turno 1 (Preto), ela já começa jogando
        if (turno === turnoIA) {
            setTimeout(() => {
                if (typeof jogadaDaIA === 'function') jogadaDaIA();
            }, 1200); 
        }
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
    // 1. FECHA O MODAL IMEDIATAMENTE
    const modalEmoji = document.getElementById('modal-emoji-selecao');
    if (modalEmoji) {
        modalEmoji.style.display = 'none';
        modalEmoji.classList.remove('ativo', 'active', 'show');
    }

    // 2. VERIFICA SE O LADO ESTÁ DEFINIDO
    if (!meuLado) {
        console.warn("Lado não definido. Escolha uma cor antes de enviar emojis.");
        return;
    }

    // 3. LÓGICA DE ENVIO (Firebase)
    if (modoJogo === 'online') {
        // Padronizando os nomes para: 'texto' e 'ts' (conforme seu onValue)
        set(emojiRef, { 
            texto: emoji, 
            lado: meuLado, 
            ts: Date.now() 
        }).catch(err => console.error("Erro ao enviar emoji:", err));
    } else {
        // Se for modo IA, apenas exibe localmente para diversão
        exibirEmojiNaTela(emoji, meuLado);
    }
};

function atualizarUI() {
    document.getElementById('capturas-v').innerText = capturasV;
    document.getElementById('capturas-p').innerText = capturasP;
    document.getElementById('box-vermelho').classList.toggle('turno-ativo-vermelho', turno === 1);
    document.getElementById('box-preto').classList.toggle('turno-ativo-preto', turno === 2);
}

// 🟢 função clicar

function clicar(r, c) {

    if (modoJogo === 'online') {
        // Define o ID numérico baseado no lado (Vermelho = 1, Preto = 2)
        const meuTurnoID = (meuLado === 'vermelho') ? 1 : (meuLado === 'preto' ? 2 : null);

        // 1. Só permite interagir se a partida foi confirmada (ambos na sala)
        if (!partidaConfirmada) {
            console.warn("Aguardando ambos os jogadores para iniciar...");
            return;
        }

        // 2. Bloqueia o clique se não for a vez do jogador atual
        if (turno !== meuTurnoID) {
            console.log("Não é sua vez! Turno atual do jogador:", turno);
            return;
        }
    }

    const valor = mapa[r][c];
    const ehVezDoVermelho = (turno === 1 && (valor === 1 || valor === 3));
    const ehVezDoPreto    = (turno === 2 && (valor === 2 || valor === 4));

    // 👉 PASSO 1: SELEÇÃO DE PEÇA
    if (ehVezDoVermelho || ehVezDoPreto) {
        const todasAsJogadas = obterTodosMvs(mapa, turno);
        const capturasObrigatorias = todasAsJogadas.filter(m => m.cap);

        // LEI DA CAPTURA (SOPRO): Força captura se existir uma disponível
        if (capturasObrigatorias.length > 0) {
            const estaPecaPodeComer = capturasObrigatorias.some(
                m => m.de.r === r && m.de.c === c
            );

            if (!estaPecaPodeComer) {
                if (typeof window.mostrarAvisoCaptura === 'function') {
                    window.mostrarAvisoCaptura();
                }
                return;
            }
        }

        // Seleciona a peça e redesenha o tabuleiro para mostrar o destaque
        selecionada = { r, c };
        desenhar();
        return;
    }

    if (selecionada && valor === 0) {
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

// 🟢 TRAVA ONLINE E EXECUÇÃO DE MOVIMENTO
function validarEMover(r, c) {

    // Impede movimentos se o modo for online mas o oponente ainda não entrou
    if (modoJogo === 'online' && !jogoIniciado) {
        if (typeof window.exibirFeedback === 'function') {
            window.exibirFeedback("Aguardando oponente para começar...", "erro");
        } else {
            console.warn("Aguardando oponente para começar...");
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

        // Animação visual da peça sendo comida indo para o placar
        if (typeof animarPecaParaPlacar === 'function') {
            animarPecaParaPlacar(rCap, cCap, mapa[rCap][cCap]);
        }

        mapa[rCap][cCap] = 0; // Remove a peça capturada
        turno === 1 ? capturasV++ : capturasP++;
        
        if (typeof tocarSom === 'function') tocarSom('cap');

    } else {
        if (typeof tocarSom === 'function') tocarSom('move');
    }

    // --- COROAÇÃO (VIRAR DAMA) ---
    const pecaValor = mapa[selecionada.r][selecionada.c];
    let pecaFinal = pecaValor;

    if ((turno === 1 && r === 0) || (turno === 2 && r === 7)) {
        if (pecaValor <= 2) { // Se ainda for peça comum
            pecaFinal = (turno === 1) ? 3 : 4; // 3=Dama Vermelha, 4=Dama Preta
            
        }
    }

    mapa[r][c] = pecaFinal;
    mapa[selecionada.r][selecionada.c] = 0;

    // --- CONTINUIDADE (COMBO DE CAPTURA) ---
    const novasJogadas = obterTodosMvs(mapa, turno);
    const temMais = movValido.cap && novasJogadas.some(m =>
        m.de.r === r &&
        m.de.c === c &&
        m.cap
    );

    if (temMais) {
        selecionada = { r, c };

        if (modoJogo === 'online') {
            import("https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js").then(({ update }) => {
                update(gameRef, { 
                    mapa: mapa,
                    capturasV: capturasV,
                    capturasP: capturasP
                });
            });
        }
    } else {
        // Finaliza a jogada e troca o turno
        selecionada = null;
        const novoTurno = (turno === 1 ? 2 : 1);

        // 🔥 SALVA NO FIREBASE (MODO ONLINE) - ATUALIZAÇÃO SEGURA
        if (modoJogo === 'online') {
            import("https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js").then(({ update }) => {
                update(gameRef, {
                    mapa: mapa,
                    turno: novoTurno,
                    capturasV: capturasV,
                    capturasP: capturasP,
                    ts: Date.now() // Timestamp para marcar a última alteração
                }).then(() => {

                }).catch(err => console.error("Erro ao atualizar:", err));
            });
        }

        turno = novoTurno;

        if (typeof verificarFimDeJogo === 'function') {
            verificarFimDeJogo();
        }
    }

    // --- ATUALIZAÇÃO DA INTERFACE (UI) ---
    desenhar();
    if (typeof atualizarDestaqueTurno === 'function') atualizarDestaqueTurno();
    if (typeof atualizarUI === 'function') atualizarUI();

    // --- LÓGICA DE IA (MODO OFFLINE) ---
    if (modoJogo === 'ia' && !temMais) {
        const turnoIA = (meuLado === 'vermelho' ? 2 : 1);
        if (turno === turnoIA) {
            setTimeout(jogadaDaIA, 600);
        }
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

function avaliarTabuleiro(mapa, turnoIA) {
    let score = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const v = mapa[r][c];

            if (v === 0) continue;

            // Identifica se a peça pertence à IA ou ao Humano
            const ehIA = (turnoIA === 1 && (v === 1 || v === 3)) ||
                         (turnoIA === 2 && (v === 2 || v === 4));

            // --- 1. VALOR BASE DA PEÇA ---
            // Usamos valores maiores (100 e 300) para permitir maior precisão nos bônus
            let valorPeca = (v === 3 || v === 4) ? 300 : 100;

            // --- 2. BÔNUS DE POSICIONAMENTO ESTRATÉGICO ---
            
            // Controle do Centro: Peças no centro (linhas 3,4,5 e colunas 2,3,4,5) 
            // dominam mais o tabuleiro e são mais difíceis de cercar.
            if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
                valorPeca += 25;
            }

            // Segurança nas Bordas: Peças nas laterais não podem ser capturadas por dois lados.
            if (c === 0 || c === 7) {
                valorPeca += 15;
            }

            // Defesa da Base: Incentiva a IA a manter as peças da última linha paradas 
            // para evitar que o jogador faça dama facilmente.
            if ((turnoIA === 1 && r === 7) || (turnoIA === 2 && r === 0)) {
                valorPeca += 40;
            }

            // --- 3. CÁLCULO DO SCORE FINAL ---
            if (ehIA) {
                score += valorPeca;
                // Bônus por avanço: quanto mais perto de virar dama, melhor
                const progresso = (turnoIA === 1 ? (7 - r) : r);
                score += progresso * 10; 
            } else {
                // Penalidade por peças do oponente (IA quer reduzir isso ao máximo)
                score -= valorPeca;
                const progressoOponente = (turnoIA === 1 ? r : (7 - r));
                score -= progressoOponente * 10;
            }
        }
    }

    return score;
}

function minimax(mapa, profundidade, alpha, beta, maximizando, turnoAtual, turnoIA) {
    // 1. Condição de parada: profundidade alcançada
    if (profundidade === 0) {
        return avaliarTabuleiro(mapa, turnoIA);
    }

    // 2. IMPORTANTE: Usar a lógica de jogadas OBRIGATÓRIAS (capturas)
    // Isso impede que a IA ignore capturas nas simulações futuras.
    const mvs = obterJogadasValidasObrigatorias(mapa, turnoAtual);
    
    // 3. Condição de derrota/vitória simulada
    if (mvs.length === 0) {
        return maximizando ? -10000 : 10000;
    }

    if (maximizando) {
        let melhor = -Infinity;

        for (const mv of mvs) {
            const copia = JSON.parse(JSON.stringify(mapa));
            aplicarMovimentoSimulado(copia, mv, turnoAtual);

            // Se houve captura, o turno pode continuar sendo da mesma pessoa (combo)
            // Para simplificar o Minimax e evitar travamentos, alternamos o turno,
            // mas a lógica de captura obrigatória já cuida do peso das peças.
            const valor = minimax(
                copia,
                profundidade - 1,
                alpha,
                beta,
                false,
                turnoAtual === 1 ? 2 : 1,
                turnoIA
            );

            melhor = Math.max(melhor, valor);
            alpha = Math.max(alpha, valor);
            if (beta <= alpha) break; // Poda Alpha-Beta
        }
        return melhor;
    } else {
        let pior = Infinity;

        for (const mv of mvs) {
            const copia = JSON.parse(JSON.stringify(mapa));
            aplicarMovimentoSimulado(copia, mv, turnoAtual);

            const valor = minimax(
                copia,
                profundidade - 1,
                alpha,
                beta,
                true,
                turnoAtual === 1 ? 2 : 1,
                turnoIA
            );

            pior = Math.min(pior, valor);
            beta = Math.min(beta, valor);
            if (beta <= alpha) break; // Poda Alpha-Beta
        }
        return pior;
    }
}

function aplicarMovimentoSimulado(mapa, mv, turno) {
    const { de, para, cap } = mv;

    mapa[para.r][para.c] = mapa[de.r][de.c];
    mapa[de.r][de.c] = 0;

    if (cap) {
        mapa[cap.r][cap.c] = 0;
    }
}

function obterJogadasValidasObrigatorias(mapa, turno) {
    const todas = obterTodosMvs(mapa, turno);
    const capturas = todas.filter(m => m.cap);

    // Se houver captura, SOMENTE capturas são válidas
    return capturas.length > 0 ? capturas : todas;
}

// ✅ ---IA AVANÇADA COM SUPORTE A COMBO ---

async function jogadaDaIA() {
    const turnoIA = (meuLado === 'vermelho') ? 2 : 1;
    if (turno !== turnoIA || modoJogo !== 'ia') return;

    // Se não estiver no meio de um combo, aguarda o tempo de pensamento
    if (!selecionada) {
        await new Promise(r => setTimeout(r, 2000));
    }

    let jogadasValidas = obterJogadasValidasObrigatorias(mapa, turnoIA);
    if (jogadasValidas.length === 0) return;

    // --- LÓGICA DA LEI DA MAIORIA EMBUTIDA ---
    const capturas = jogadasValidas.filter(m => m.cap);
    
    if (capturas.length > 0) {
        // Mapeia cada jogada para descobrir quantas peças ela captura no total (combos inclusos)
        const capturasComPeso = capturas.map(mv => {
            let totalCapturas = 0;
            let mapaSimulado = JSON.parse(JSON.stringify(mapa));
            let rAtual = mv.para.r;
            let cAtual = mv.para.c;
            
            // Simulação local rápida para contar o combo deste movimento específico
            totalCapturas++; // Conta a primeira captura
            mapaSimulado[mv.para.r][mv.para.c] = mapaSimulado[mv.de.r][mv.de.c];
            mapaSimulado[mv.de.r][mv.de.c] = 0;
            mapaSimulado[mv.cap.r][mv.cap.c] = 0;

            // Verifica recursivamente saltos extras apenas para contagem
            let temMais = true;
            while (temMais) {
                let proximas = obterTodosMvs(mapaSimulado, turnoIA).filter(m => 
                    m.de.r === rAtual && m.de.c === cAtual && m.cap
                );
                if (proximas.length > 0) {
                    totalCapturas++;
                    let prox = proximas[0];
                    mapaSimulado[prox.para.r][prox.para.c] = mapaSimulado[prox.de.r][prox.de.c];
                    mapaSimulado[prox.de.r][prox.de.c] = 0;
                    mapaSimulado[prox.cap.r][prox.cap.c] = 0;
                    rAtual = prox.para.r;
                    cAtual = prox.para.c;
                } else {
                    temMais = false;
                }
            }
            return { movimento: mv, peso: totalCapturas };
        });

        // Filtra para manter apenas os movimentos que capturam o número MÁXIMO de peças
        const maxPeças = Math.max(...capturasComPeso.map(c => c.peso));
        jogadasValidas = capturasComPeso
            .filter(c => c.peso === maxPeças)
            .map(c => c.movimento);
    }

    let movimentosPossiveis = jogadasValidas;
    if (selecionada) {
        movimentosPossiveis = jogadasValidas.filter(m => 
            m.de.r === selecionada.r && m.de.c === selecionada.c
        );
    }

    let melhorJogada = null;
    let melhorValor = -Infinity;
    const profundidade = 8;

    for (const mv of movimentosPossiveis) {
        const copia = JSON.parse(JSON.stringify(mapa));
        aplicarMovimentoSimulado(copia, mv, turnoIA);

        const valor = minimax(
            copia,
            profundidade,
            -Infinity,
            Infinity,
            false,
            turnoIA === 1 ? 2 : 1,
            turnoIA
        );

        if (valor > melhorValor) {
            melhorValor = valor;
            melhorJogada = mv;
        }
    }

    if (melhorJogada) {
        selecionada = melhorJogada.de;
        
        // Executa o movimento real no tabuleiro
        validarEMover(melhorJogada.para.r, melhorJogada.para.c);
        desenhar();

        // LÓGICA DE COMBO: Se 'selecionada' ainda existir, a IA continua jogando
        if (selecionada) {
            setTimeout(jogadaDaIA, 800);
        }
    }
}

// ✅ verificarFimDeJogo

function verificarFimDeJogo() {
    let temVermelho = false;
    let temPreto = false;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (mapa[r][c] === 1 || mapa[r][c] === 3) temVermelho = true;
            if (mapa[r][c] === 2 || mapa[r][c] === 4) temPreto = true;
        }
    }

    if (!temVermelho || !temPreto) {
        const ladoVencedor = temVermelho ? "vermelho" : "preto";

        // --- NOVIDADE: Envia para o Firebase se for online ---
        if (modoJogo === 'online') {
            set(ref(db, 'partida_unica/vencedor'), ladoVencedor);
        }

        // Execução local (para quem fez a jogada)
        if (meuLado === ladoVencedor) {
            exibirModalVitoria(ladoVencedor.toUpperCase());
        } else {
            exibirModalDerrota();
        }
    }
}

function exibirModalVitoria(vencedor) {
    const tela = document.getElementById('tela-vitoria');
    const texto = document.getElementById('vencedor-texto');
    
    if (tela && texto) {
        texto.innerText = `VITÓRIA DO ${vencedor}!`;
        
        // Garante que o elemento se torne visível
        tela.style.display = 'flex'; 
        
        setTimeout(() => {
            tela.classList.add('ativo');
        }, 10);
    }
}

function exibirModalDerrota() {
    const tela = document.getElementById('tela-derrota');
    
    if (tela) {
        // Exibe o container
        tela.style.display = 'flex'; 
        
        // Ativa a animação de opacidade/escala definida no seu CSS
        setTimeout(() => {
            tela.classList.add('ativo');
        }, 10);
    }
}

// Função para sair do jogo

window.sairDoJogo = async function() {
    if (modoJogo === 'online') {
        const confirmacao = confirm("Deseja realmente sair da partida?");
        if (!confirmacao) return;

        try {
            // Importar o 'remove' do database se necessário
            const { remove } = await import("https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js");

            // 1. Exibe o feedback local antes de sair
            const meuNome = document.getElementById(`input-nome-${meuLado === 'vermelho' ? 'v' : 'p'}`).value;
            exibirAlertaSaida(meuNome || "Você");

            // 2. Remove os dados da partida no Firebase
            // Apagar 'partida_unica' reinicia o jogo para todos os conectados
            await remove(ref(db, 'partida_unica'));

        } catch (error) {
        }
    }

    // Redireciona para a tela inicial ou recarrega a página após um curto delay
    setTimeout(() => {
        window.location.reload(); 
    }, 2000);
};

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

    // Vermelho sobe / Preto desce
    if (
        (j === 1 && dr < 0) ||  
        (j === 2 && dr > 0)
    ) {
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