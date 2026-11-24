const teclado = document.querySelector("#teclado");
const instrumento = document.querySelector("#instrumento");
const volume = document.querySelector("#volume");
const valorVolume = document.querySelector("#valorVolume");
const notificacao = document.querySelector("#notificacao");
const sequenciaMusica = document.querySelector("#sequencia-musica");
const progressoMusica = document.querySelector("#progresso-musica");
const botoesMusica = document.querySelectorAll("[data-musica]");

const notas = [
    { tecla: "a", nome: "Do", frequencia: "C4" },
    { tecla: "s", nome: "Re", frequencia: "D4" },
    { tecla: "d", nome: "Mi", frequencia: "E4" },
    { tecla: "f", nome: "Fa", frequencia: "F4" },
    { tecla: "g", nome: "Sol", frequencia: "G4" },
    { tecla: "h", nome: "La", frequencia: "A4" },
    { tecla: "j", nome: "Si", frequencia: "B4" },
    { tecla: "k", nome: "Do alto", frequencia: "C5" }
];

const musicas = {
    estrelinha: {
        nome: "Brilha, brilha estrelinha",
        teclas: ["a", "a", "g", "g", "h", "h", "g", "f", "f", "d", "d", "s", "s", "a"]
    },
    alegria: {
        nome: "Ode a Alegria",
        teclas: ["d", "d", "f", "g", "g", "f", "d", "s", "a", "a", "s", "d", "d", "s", "s"]
    },
    cordeirinho: {
        nome: "Mary tinha um cordeirinho",
        teclas: ["d", "s", "a", "s", "d", "d", "d", "s", "s", "s", "d", "g", "g", "d", "s", "a", "s", "d", "d", "d", "d", "s", "s", "d", "s", "a"]
    },
    frere: {
        nome: "Frere Jacques",
        teclas: ["a", "s", "d", "a", "a", "s", "d", "a", "d", "f", "g", "d", "f", "g", "g", "h", "g", "f", "d", "a", "g", "h", "g", "f", "d", "a", "a", "g", "a", "a", "g", "a"]
    },
    jingle: {
        nome: "Jingle Bells",
        teclas: ["d", "d", "d", "d", "d", "d", "d", "g", "a", "s", "d", "d", "d", "d", "d", "d", "d", "g", "a", "s", "a", "a", "a", "a", "a", "d", "s", "g", "g", "d", "s", "a"]
    },
    fazenda: {
        nome: "Seu MacDonald tinha uma fazenda",
        teclas: ["a", "a", "a", "g", "h", "h", "g", "d", "d", "s", "s", "a"]
    },
    ponte: {
        nome: "A ponte de Londres",
        teclas: ["g", "h", "g", "f", "d", "f", "g", "s", "d", "f", "d", "f", "g", "g", "h", "g", "f", "d", "f", "g", "s", "g", "d", "a"]
    },
    remo: {
        nome: "Remo, remo, seu barco",
        teclas: ["a", "a", "a", "s", "d", "d", "s", "d", "f", "g", "k", "k", "k", "g", "g", "g", "d", "d", "d", "a", "a", "a", "g", "f", "d", "s", "a"]
    }
};

let synth;
const entradasAtivas = new Map();
const frequenciasAtivas = new Map();
let musicaAtual = null;
let passoAtual = 0;

function criarInstrumento() {
    if (synth) {
        frequenciasAtivas.forEach((frequencia) => synth.triggerRelease(frequencia));
        frequenciasAtivas.clear();
        synth.dispose();
    }

    if (instrumento.value === "piano") {
        synth = new Tone.Sampler({
            urls: {
                C4: "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                A4: "A4.mp3"
            },
            baseUrl: "https://tonejs.github.io/audio/salamander/",
            release: 1
        }).toDestination();
    } else if (instrumento.value === "organ") {
        synth = new Tone.PolySynth(Tone.AMSynth).toDestination();
        synth.set({
            harmonicity: 2.5,
            envelope: { attack: 0.02, release: 0.5 }
        });
    } else if (instrumento.value === "bass") {
        synth = new Tone.PolySynth(Tone.MonoSynth, {
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.8 }
        }).toDestination();
    } else {
        synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.set({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.8 }
        });
    }

    atualizarVolume();
}

function atualizarVolume() {
    if (synth) {
        synth.volume.value = (Number(volume.value) / 100) * 40 - 30;
    }
    valorVolume.textContent = `${volume.value}%`;
}

function obterEntradas(tecla) {
    if (!entradasAtivas.has(tecla)) entradasAtivas.set(tecla, new Set());
    return entradasAtivas.get(tecla);
}

async function pressionarNota(frequencia, tecla, origem) {
    const entradas = obterEntradas(tecla);
    if (entradas.has(origem)) return;

    const primeiraEntrada = entradas.size === 0;
    entradas.add(origem);
    document.querySelector(`[data-tecla="${tecla}"]`)?.classList.add("ativa");

    if (!primeiraEntrada) return;
    conferirNotaDaMusica(tecla);

    await Tone.start();
    if (!entradasAtivas.get(tecla)?.size) return;
    if (!synth) criarInstrumento();

    if (synth instanceof Tone.Sampler && !synth.loaded) {
        await Tone.loaded();
        if (!entradasAtivas.get(tecla)?.size) return;
    }

    synth.triggerAttack(frequencia);
    frequenciasAtivas.set(tecla, frequencia);
    const nota = notas.find((item) => item.tecla === tecla);
    notificacao.textContent = nota ? `Voce tocou ${nota.nome}` : "";
}

function soltarNota(tecla, origem) {
    const entradas = entradasAtivas.get(tecla);
    if (!entradas) return;

    entradas.delete(origem);
    if (entradas.size > 0) return;

    entradasAtivas.delete(tecla);
    document.querySelector(`[data-tecla="${tecla}"]`)?.classList.remove("ativa");

    const frequencia = frequenciasAtivas.get(tecla);
    if (frequencia && synth) {
        synth.triggerRelease(frequencia);
        frequenciasAtivas.delete(tecla);
    }
}

function soltarTodasAsNotas() {
    Array.from(entradasAtivas.entries()).forEach(([tecla, entradas]) => {
        Array.from(entradas).forEach((origem) => soltarNota(tecla, origem));
    });
}

function montarTeclado() {
    notas.forEach((nota) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "nota";
        botao.dataset.tecla = nota.tecla;
        botao.innerHTML = `
            <span class="tecla">${nota.tecla.toUpperCase()}</span>
            <span>${nota.nome}</span>
        `;

        botao.addEventListener("pointerdown", (evento) => {
            evento.preventDefault();
            botao.setPointerCapture(evento.pointerId);
            pressionarNota(nota.frequencia, nota.tecla, `pointer-${evento.pointerId}`);
        });
        botao.addEventListener("pointerup", (evento) => {
            soltarNota(nota.tecla, `pointer-${evento.pointerId}`);
        });
        botao.addEventListener("pointercancel", (evento) => {
            soltarNota(nota.tecla, `pointer-${evento.pointerId}`);
        });
        botao.addEventListener("lostpointercapture", (evento) => {
            soltarNota(nota.tecla, `pointer-${evento.pointerId}`);
        });
        teclado.appendChild(botao);
    });
}

function selecionarMusica(id) {
    musicaAtual = musicas[id];
    passoAtual = 0;

    botoesMusica.forEach((botao) => {
        botao.classList.toggle("selecionada", botao.dataset.musica === id);
    });

    sequenciaMusica.innerHTML = "";
    musicaAtual.teclas.forEach((tecla, indice) => {
        const elemento = document.createElement("span");
        elemento.className = "nota-musical";
        elemento.textContent = tecla.toUpperCase();
        elemento.dataset.passo = String(indice);
        sequenciaMusica.appendChild(elemento);
    });

    progressoMusica.textContent = `Musica: ${musicaAtual.nome}. Comece pela nota destacada.`;
    atualizarProgresso();
}

function atualizarProgresso() {
    const notasNaTela = sequenciaMusica.querySelectorAll(".nota-musical");
    notasNaTela.forEach((elemento, indice) => {
        elemento.classList.toggle("tocada", indice < passoAtual);
        elemento.classList.toggle("proxima", indice === passoAtual);
    });
}

function conferirNotaDaMusica(tecla) {
    if (!musicaAtual || passoAtual >= musicaAtual.teclas.length) return;

    if (musicaAtual.teclas[passoAtual] === tecla) {
        passoAtual += 1;
        if (passoAtual === musicaAtual.teclas.length) {
            progressoMusica.textContent = `Muito bem! Voce tocou "${musicaAtual.nome}"!`;
        } else {
            progressoMusica.textContent = `Muito bem! Nota ${passoAtual} de ${musicaAtual.teclas.length}.`;
        }
        atualizarProgresso();
    } else {
        const teclaEsperada = musicaAtual.teclas[passoAtual].toUpperCase();
        progressoMusica.textContent = `Tente novamente: a proxima tecla e ${teclaEsperada}.`;
    }
}

document.addEventListener("keydown", (evento) => {
    const tecla = evento.key.toLowerCase();
    const nota = notas.find((item) => item.tecla === tecla);
    if (!nota || evento.repeat) return;

    evento.preventDefault();
    pressionarNota(nota.frequencia, tecla, "teclado");
});

document.addEventListener("keyup", (evento) => {
    soltarNota(evento.key.toLowerCase(), "teclado");
});

window.addEventListener("blur", soltarTodasAsNotas);
instrumento.addEventListener("change", () => {
    soltarTodasAsNotas();
    criarInstrumento();
});
volume.addEventListener("input", atualizarVolume);
botoesMusica.forEach((botao) => {
    botao.addEventListener("click", () => selecionarMusica(botao.dataset.musica));
});

montarTeclado();
