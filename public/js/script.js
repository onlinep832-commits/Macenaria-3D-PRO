import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const BD = window.bancoDados || { catalogoModulos: [], coresMDF: {}, coresBorda: {}, catalogoFerragens: {}, configCalculo: {} };
const C3D = { "branco-tx": "#f1f2f6", "preto-tx": "#2f3640", "cinza-cristal": "#dcdde1", "grafite": "#718093", "verde-jade": "#1abc9c", "azul-petroleo": "#273c75", "carvalho-malva": "#d1ccc0", "nogueira-caiena": "#8c7ae6", "freijo-puro": "#e1b12c", "louro-freijo": "#fbc531", "cumaru-raiz": "#cd6133", "cimento-queimado": "#7f8fa6", "linho": "#f5f6fa", "mdf-cru": "#d2dae2", "branco-diamante-brilhante": "#ffffff", "preto-fosco-laca": "#222f3e", "titanio": "#718093", "carvallho-diam": "#b33939" };
const TEX_PISO = [{ n: "Madeira Clara", u: "https://i.imgur.com/8B5sKpX.jpg" }, { n: "Madeira Escura", u: "https://i.imgur.com/JQ4aVnL.jpg" }, { n: "Porcelanato", u: "https://i.imgur.com/7nWKqVR.jpg" }, { n: "Cimento", u: "https://i.imgur.com/YhGKRqN.jpg" }];
const TEX_PAR = [{ n: "Tijolo", u: "https://i.imgur.com/sW22JpX.jpg" }, { n: "Gesso", u: "https://i.imgur.com/3vQm2Wh.jpg" }, { n: "Concreto", u: "https://i.imgur.com/YhGKRqN.jpg" }];
const TEX_TETO = [{ n: "Gesso", u: "https://i.imgur.com/3vQm2Wh.jpg" }, { n: "Madeira", u: "https://i.imgur.com/8B5sKpX.jpg" }];
const CORES_SOL = [{ n: "Branco", c: "#ffffff" }, { n: "Gelo", c: "#f5f6fa" }, { n: "Bege", c: "#ffeaa7" }, { n: "Cinza", c: "#dfe6e9" }];
const CORES_BG = [{ n: "Preto", c: "#000000" }, { n: "Cinza", c: "#1a1a2e" }, { n: "Azul", c: "#0a1628" }, { n: "Grafite", c: "#2d3436" }, { n: "Branco", c: "#ffffff" }];

const TL = new THREE.TextureLoader();
function loadTex(u, rx = 4, ry = 4) { const t = TL.load(u); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; }

const selCI = document.getElementById('ed-ci'), selCE = document.getElementById('ed-ce'), selPC = document.getElementById('ep-cor');
if (BD.coresMDF) Object.keys(BD.coresMDF).forEach(k => { const c = BD.coresMDF[k]; selCI.add(new Option(c.nome, k)); selCE.add(new Option(c.nome, k)); selPC.add(new Option(c.nome, k)); });

// === UI TABS ===
document.querySelectorAll('.ferr-aba').forEach(ab => { ab.addEventListener('click', () => { document.querySelectorAll('.ferr-aba').forEach(a => a.classList.remove('ativo')); document.querySelectorAll('.ferr-painel').forEach(p => p.classList.remove('ativo')); ab.classList.add('ativo'); document.getElementById('tab-' + ab.dataset.tab).classList.add('ativo'); document.getElementById('ferr-nome-titulo').innerText = ab.innerText.trim(); }); });
document.querySelectorAll('.sub-aba').forEach(ab => { ab.addEventListener('click', () => { document.querySelectorAll('.sub-aba').forEach(a => a.classList.remove('ativo')); ab.classList.add('ativo'); document.getElementById('subtab-modulo').style.display = ab.dataset.subtab === 'modulo' ? '' : 'none'; document.getElementById('subtab-materiais').style.display = ab.dataset.subtab === 'materiais' ? '' : 'none'; }); });
document.querySelectorAll('.arr-tab').forEach(ab => { ab.addEventListener('click', () => { document.querySelectorAll('.arr-tab').forEach(a => a.classList.remove('ativo')); ab.classList.add('ativo'); document.getElementById('arr-linear').style.display = ab.dataset.arrt === 'linear' ? '' : 'none'; document.getElementById('arr-polar').style.display = ab.dataset.arrt === 'polar' ? '' : 'none'; }); });
document.querySelectorAll('.prop-header').forEach(h => { h.addEventListener('click', () => { h.parentElement.classList.toggle('aberto'); }); });

// === THREE.JS ===
const cont = document.getElementById('area-3d');
const cena = new THREE.Scene(); cena.background = new THREE.Color('#111');
const cam = new THREE.PerspectiveCamera(45, cont.clientWidth / cont.clientHeight, 1, 20000); cam.position.set(2500, 2500, 4000);
const ren = new THREE.WebGLRenderer({ antialias: true }); ren.setSize(cont.clientWidth, cont.clientHeight); ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap; ren.toneMapping = THREE.ACESFilmicToneMapping;
cont.appendChild(ren.domElement);
cena.add(new THREE.AmbientLight(0xffffff, .65));
const dirL = new THREE.DirectionalLight(0xffffff, .65); dirL.position.set(2000, 3500, 2000); dirL.castShadow = true; dirL.shadow.mapSize.set(2048, 2048); dirL.shadow.camera.near = .5; dirL.shadow.camera.far = 12000; dirL.shadow.camera.left = -4000; dirL.shadow.camera.right = 4000; dirL.shadow.camera.top = 4000; dirL.shadow.camera.bottom = -4000; cena.add(dirL);
cena.add(new THREE.PointLight(0xffeedd, .25, 6000).translateY(2600));

// === SALA ===
const SALA = { l: 4000, p: 4000, a: 2800, e: 100, npar: 2, teto: false };
const gSala = new THREE.Group(); cena.add(gSala); let paredesFixas = [];
let colisaoAtiva = true;
function matS(c) { return new THREE.MeshStandardMaterial({ color: c, roughness: .85 }); }
function addE(m) { m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x000000 }))); }
function construirSala() { gSala.clear(); paredesFixas = []; const L = SALA.l, P = SALA.p, A = SALA.a, E = SALA.e; const p = new THREE.Mesh(new THREE.BoxGeometry(L + E * 2, 20, P + E * 2), matS('#c8a97e')); p.position.y = -10; p.receiveShadow = true; addE(p); gSala.add(p); const gr = new THREE.GridHelper(Math.max(L, P) * 1.3, Math.max(L, P) / 100, 0x444444, 0x333333); gr.position.y = 1; gr.material.opacity = .12; gr.material.transparent = true; gSala.add(gr); [{ l: 'fundo', vis: true, w: L + E * 2, h: A, x: 0, y: A / 2, z: -(P / 2) - E / 2, ry: 0 }, { l: 'esq', vis: SALA.npar >= 2, w: P + E * 2, h: A, x: -(L / 2) - E / 2, y: A / 2, z: 0, ry: Math.PI / 2 }, { l: 'dir', vis: SALA.npar >= 3, w: P + E * 2, h: A, x: (L / 2) + E / 2, y: A / 2, z: 0, ry: Math.PI / 2 }, { l: 'frente', vis: SALA.npar >= 4, w: L + E * 2, h: A, x: 0, y: A / 2, z: (P / 2) + E / 2, ry: 0 }].forEach(d => { const m = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, E), matS('#fff')); m.position.set(d.x, d.y, d.z); m.rotation.y = d.ry; m.castShadow = true; m.receiveShadow = true; addE(m); paredesFixas.push({ mesh: m, lado: d.l, visivel: d.vis, cor: '#fff', texUrl: null }); if (d.vis) gSala.add(m); }); if (SALA.teto) { const t = new THREE.Mesh(new THREE.BoxGeometry(L + E * 2, 20, P + E * 2), matS('#f5f6fa')); t.position.y = A + 10; addE(t); gSala.add(t); } }
construirSala();
function getSalaBox() { return new THREE.Box3(new THREE.Vector3(-SALA.l / 2, 0, -SALA.p / 2), new THREE.Vector3(SALA.l / 2, SALA.a, SALA.p / 2)); }

const COR_SEL = '#3498db', MAT_SEL = new THREE.MeshStandardMaterial({ color: '#f1c40f', transparent: true, opacity: .9, roughness: .2 });
const moveis = []; let ativo = null, pecaAt = null, matOrig = null, ctrlKey = false;
window.addEventListener('keydown', e => { if (e.key === 'Control') ctrlKey = true; });
window.addEventListener('keyup', e => { if (e.key === 'Control') ctrlKey = false; });
const avisoEl = document.getElementById('aviso');

function ch(w, h, d, x, y, z, mat, nome = '') { const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(1, w), Math.max(1, h), Math.max(1, d)), mat); m.userData.pecaNome = nome; m.castShadow = true; m.receiveShadow = true; m.position.set(x, y, z); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: .35 }))); return m; }

function applyPartOverrides(mesh, pecaNome, userData) {
    const po = userData.po?.[pecaNome];
    if (po) {
        if (po.px !== undefined) mesh.position.set(po.px, po.py, po.pz);
        if (po.rx !== undefined) mesh.rotation.set(po.rx, po.ry, po.rz);
    }
    return mesh;
}

function rF(formula, vars) { if (!formula) return 0; let s = String(formula); const map = [ ['EspInterna', vars.ei], ['EspExterna', vars.ee], ['EspFundo', vars.ef], ['FolgaPortaAltura', vars.cfg.folgaPortaAltura || 0], ['FolgaPortaLargura', vars.cfg.folgaPortaLargura || 0], ['AjustePuxadorAltura', vars.AjustePuxadorAltura], ['AjustePuxadorLargura', 0], ['DescontoPerfilAltura', vars.cfg.descontoPerfilAltura || 0], ['DescontoPerfilLargura', vars.cfg.descontoPerfilLargura || 0], ['DescFundoArmario', vars.cfg.descFundoArmario || 0], ['FolgaGaveta', vars.cfg.folgaGaveta || 0], ['MedidaCorredica', `(${vars.P}-50)`], ['DescAlturaLateralGav', vars.cfg.descAlturaLateralGav || 50], ['DescAlturaBaseGav', vars.cfg.descAlturaBaseGav || 80], ['ProfA', vars.PA], ['ProfB', vars.PB], ['LadoA', vars.LA], ['LadoB', vars.LB] ]; map.forEach(([k, v]) => { s = s.replace(new RegExp(k, 'gi'), v); }); s = s.replace(/\bL\b/g, vars.L).replace(/\bA\b/g, vars.A).replace(/\bP\b/g, vars.P); try { return eval(s); } catch (e) { return 0; } }

function getVars(u) { const cfg = BD.configCalculo || {}; const isCanto = u.tipoCanto === 'canto'; return { L: u.larg, A: u.alt, P: u.prof, ei: u.ei, ee: u.ee, ef: u.ef, cfg, LA: isCanto ? u.ladoA : u.larg, LB: isCanto ? u.ladoB : u.prof, PA: isCanto ? u.profA : u.prof, PB: isCanto ? u.profB : u.prof, AjustePuxadorAltura: u.tipoPuxador === 'cava' ? (cfg.descontoPuxadorCava || 30) : 0, }; }

function criarPuxador(tipo, portaW, portaH, espExt, isEsq) {
    let puxador = null;
    switch (tipo) {
        case 'perfil':
            const pxG = new THREE.CylinderGeometry(4, 4, 60, 8);
            pxG.rotateX(Math.PI / 2);
            puxador = new THREE.Mesh(pxG, new THREE.MeshStandardMaterial({ color: '#888', metalness: .7, roughness: .3 }));
            puxador.position.set(isEsq ? -(portaW/2) + 30 : (portaW/2) - 30, 0, espExt / 2 + 2);
            break;
        case 'cava':
            const matCava = new THREE.MeshStandardMaterial({ color: '#333', roughness: .9 });
            puxador = new THREE.Mesh(new THREE.BoxGeometry(portaW - 4, 20, espExt + 2), matCava);
            puxador.position.set(0, portaH / 2 - 10, 0);
            break;
    }
    if (puxador) puxador.userData.pecaNome = `Puxador (${tipo})`;
    return puxador;
}

// === GEOMETRIA L SHAPE ===
function criarShapeL(compDir, compEsq, profDir, profEsq) { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(compDir, 0); s.lineTo(compDir, profDir); s.lineTo(profEsq, profDir); s.lineTo(profEsq, compEsq); s.lineTo(0, compEsq); s.closePath(); return s; }
function meshFromShapeL(shape, espessura, mat, nome) { const g = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: espessura, bevelEnabled: false }); const m = new THREE.Mesh(g, mat); m.userData.pecaNome = nome; m.castShadow = true; m.receiveShadow = true; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: .4 }))); return m; }

// === MONTAR CANTO L ===
function montarCanto(g, sel = false, rx = false) {
    const u = g.userData; g.clear();
    const CD = u.ladoA, CE = u.ladoB, PD = u.profA, PE = u.profB, A = u.alt, eI = u.ei, eE = u.ee, eF = u.ef;
    const mC = new THREE.MeshStandardMaterial({ color: sel ? COR_SEL : (C3D[u.corI] || '#d1d8e0'), roughness: .75, transparent: rx, opacity: rx ? .3 : 1 });
    const mF = new THREE.MeshStandardMaterial({ color: sel ? COR_SEL : (C3D[u.corE] || '#fff'), roughness: .5, transparent: rx, opacity: rx ? .5 : 1 });
    const mFd = new THREE.MeshStandardMaterial({ color: sel ? COR_SEL : (C3D[u.corI] || '#d1d8e0'), roughness: .85, transparent: rx, opacity: rx ? .25 : 1, side: THREE.DoubleSide });
    const cX = CD / 2, cZ = CE / 2, halfA = A / 2;
    const shapeExt = criarShapeL(CD, CE, PD, PE), shapeInt = criarShapeL(CD - eI, CE - eI, PD - eI, PE - eI);
    const bottom = meshFromShapeL(shapeExt, eI, mC, 'Base Inferior'); bottom.rotation.x = -Math.PI / 2; bottom.position.set(-cX, -halfA, -cZ); g.add(applyPartOverrides(bottom, 'Base Inferior', u));
    const top = meshFromShapeL(shapeExt, eI, mC, 'Tampo Superior'); top.rotation.x = -Math.PI / 2; top.position.set(-cX, halfA - eI, -cZ); g.add(applyPartOverrides(top, 'Tampo Superior', u));
    const fundoDir = ch(CD - eF, A - eI * 2, eF, -cX + eF / 2 + (CD - eF) / 2, 0, -cZ + eF / 2, mFd, 'Fundo Direito'); g.add(applyPartOverrides(fundoDir, 'Fundo Direito', u));
    const fundoEsq = ch(eF, A - eI * 2, CE - eF, -cX + eF / 2, 0, -cZ + eF / 2 + (CE - eF) / 2, mFd, 'Fundo Esquerdo'); g.add(applyPartOverrides(fundoEsq, 'Fundo Esquerdo', u));
    if (CD - PE > 0) g.add(applyPartOverrides(ch(CD - PE, A, eI, -cX + PE + (CD - PE) / 2, 0, -cZ + PD - eI / 2, mC, 'Lateral Direita Ext'), 'Lateral Direita Ext', u));
    if (CE - PD > 0) g.add(applyPartOverrides(ch(eI, A, CE - PD, -cX + PE - eI / 2, 0, -cZ + PD + (CE - PD) / 2, mC, 'Lateral Esquerda Ext'), 'Lateral Esquerda Ext', u));
    g.add(applyPartOverrides(ch(eI, A, PD, -cX + CD - eI / 2, 0, -cZ + PD / 2, mC, 'Lateral Direita Ponta'), 'Lateral Direita Ponta', u));
    g.add(applyPartOverrides(ch(PE, A, eI, -cX + PE / 2, 0, -cZ + CE - eI / 2, mC, 'Lateral Esquerda Ponta'), 'Lateral Esquerda Ponta', u));
    if (PE - eI > 0) g.add(applyPartOverrides(ch(PE - eI, A - eI * 2, eI, -cX + eI + (PE - eI) / 2, 0, -cZ + PD - eI / 2, mC, 'Divisória Horizontal'), 'Divisória Horizontal', u));
    if (PD - eI > 0) g.add(applyPartOverrides(ch(eI, A - eI * 2, PD - eI, -cX + PE - eI / 2, 0, -cZ + eI + (PD - eI) / 2, mC, 'Divisória Vertical'), 'Divisória Vertical', u));
    const numPrat = u.numPrateleiras || 1;
    for (let i = 0; i < numPrat; i++) { const shelf = meshFromShapeL(shapeInt, eI, mC, `Prateleira ${i + 1}`); shelf.rotation.x = -Math.PI / 2; shelf.position.set(-cX + eI, -halfA + eI + ((A - eI * 2) / (numPrat + 1)) * (i + 1), -cZ); g.add(applyPartOverrides(shelf, `Prateleira ${i + 1}`, u)); }
    const rH = 80;
    if (CD - PE - eI > 0) g.add(applyPartOverrides(ch(CD - PE - eI, rH, eI, -cX + PE + eI + (CD - PE - eI) / 2, halfA - eI - rH / 2, -cZ + PD - eI / 2, mC, 'Régua Direita'), 'Régua Direita', u));
    if (CE - PD - eI > 0) g.add(applyPartOverrides(ch(eI, rH, CE - PD - eI, -cX + PE - eI / 2, halfA - eI - rH / 2, -cZ + PD + eI + (CE - PD - eI) / 2, mC, 'Régua Esquerda'), 'Régua Esquerda', u));
    
    const v = getVars(u); const portaH = A - eI * 2 - (BD.configCalculo.folgaPortaAltura || 4);
    const portaDirW = CD - PE - eI;
    if (portaDirW > 20) {
        const pivDir = new THREE.Group(); pivDir.position.set(-cX + PE + eI, 0, -cZ + PD + eE / 2); pivDir.userData.isPorta = true; pivDir.userData.dirAb = 1;
        const portaD = ch(portaDirW, rF(`A - EspInterna*2 - FolgaPortaAltura - AjustePuxadorAltura`, v), eE, portaDirW / 2, 0, 0, mF, 'Porta Direita');
        const puxador = criarPuxador(u.tipoPuxador, portaDirW, portaD.geometry.parameters.height, eE, false); if (puxador) portaD.add(puxador);
        pivDir.add(portaD); g.add(pivDir);
    }
    const portaEsqW = CE - PD - eI;
    if (portaEsqW > 20) {
        const pivEsq = new THREE.Group(); pivEsq.position.set(-cX + PE + eE / 2, 0, -cZ + PD + eI); pivEsq.rotation.y = Math.PI / 2; pivEsq.userData.isPorta = true; pivEsq.userData.dirAb = -1;
        const portaE = ch(portaEsqW, rF(`A - EspInterna*2 - FolgaPortaAltura - AjustePuxadorAltura`, v), eE, portaEsqW / 2, 0, 0, mF, 'Porta Esquerda');
        const puxador = criarPuxador(u.tipoPuxador, portaEsqW, portaE.geometry.parameters.height, eE, false); if (puxador) portaE.add(puxador);
        pivEsq.add(portaE); g.add(pivEsq);
    }
    g.add(new THREE.Mesh(new THREE.BoxGeometry(CD, A, CE), new THREE.MeshBasicMaterial({ visible: false })));
    g.userData.aberto = u.aberto || false;
}

// === MONTAR RETO (Lógica de montagem genérica com suporte a puxadores e rotação de peças) [CORRIGIDO] ===
function montarReto(g, L, A, P, sel = false, rx = false, orig = null) {
    const u = g.userData; g.clear();
    const mC = new THREE.MeshStandardMaterial({ color: sel ? COR_SEL : (C3D[u.corI] || '#d1d8e0'), roughness: .8, transparent: rx, opacity: rx ? .3 : 1 });
    const mF = new THREE.MeshStandardMaterial({ color: sel ? COR_SEL : (C3D[u.corE] || '#fff'), roughness: .5, transparent: rx, opacity: rx ? .5 : 1 });
    
    if (!orig || !orig.pecas) {
        const eI = u.ei, eF = u.ef;
        g.add(ch(eI, A, P, -(L / 2) + (eI / 2), 0, 0, mC, 'lat-e'));
        g.add(ch(eI, A, P, (L / 2) - (eI / 2), 0, 0, mC, 'lat-d'));
        g.add(ch(L - eI * 2, eI, P, 0, -(A / 2) + (eI / 2), 0, mC, 'base'));
        g.add(ch(L - eI * 2, eI, P, 0, (A / 2) - (eI / 2), 0, mC, 'tampo'));
        g.add(ch(L - eI * 2, A - eI * 2, eF, 0, 0, -(P / 2) + (eF / 2), mC, 'fundo'));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(L, A, P), new THREE.MeshBasicMaterial({ visible: false })));
        return;
    }

    const v = getVars(u);
    const pecasProcessadas = [];
    let hRod = 0;

    orig.pecas.forEach(p => {
        const q = Math.round(rF(p.qtd || "1", v));
        if (q <= 0) return;
        const n = p.nome.toLowerCase();
        const tm = (p.tipoMaterial || "interna").toLowerCase();
        let mat = tm === 'externa' ? mF : mC;
        if (u.po && u.po[p.nome] && u.po[p.nome].ck) {
            mat = mat.clone();
            mat.color.set(sel ? COR_SEL : (C3D[u.po[p.nome].ck] || '#d1d8e0'));
        }
        if (n.includes('rodape') || n.includes('rodapé')) {
            hRod = Math.max(hRod, Math.min(rF(p.altura, v), rF(p.largura, v)));
        }
        pecasProcessadas.push({ def: p, q: q, n: n, mat: mat });
    });

    const frentes = pecasProcessadas.filter(p => (p.n.includes('porta') || p.n.includes('frente') || p.n.includes('gaveta')) && !p.n.includes('falsa'));
    const internos = pecasProcessadas.filter(p => !frentes.includes(p));
    const unpositionedInternals = [];

    // Primeiro, processa peças que NÃO têm posição explícita (a estrutura básica)
    internos.forEach(p => {
        const def = p.def;
        if (def.posX || def.posY || def.posZ) {
            unpositionedInternals.push(p);
            return; // Adia o processamento de peças com posição
        }
        for (let i = 0; i < p.q; i++) {
            let mesh;
            let dA = rF(def.altura, v), dL = rF(def.largura, v), esp = rF(def.espessura, v) || (p.mat === mF ? u.ee : u.ei);
            
            if (p.n.includes('lateral') && (p.n.includes('esq') || p.n.includes('dir'))) {
                mesh = ch(esp, dA, dL, p.n.includes('esq') ? -L / 2 + esp / 2 : L / 2 - esp / 2, -A / 2 + hRod + dA / 2, 0, p.mat, def.nome);
            } else if (p.n.includes('base') || p.n.includes('tampo')) {
                mesh = ch(dL, esp, dA, 0, p.n.includes('base') || p.n.includes('inf') ? -A / 2 + hRod + esp / 2 : A / 2 - esp / 2, 0, p.mat, def.nome);
            } else if (p.n.includes('fundo')) {
                 mesh = ch(dL, dA, esp, 0, -A/2 + hRod + dA/2, -P / 2 + esp / 2, p.mat, def.nome);
            } else {
                unpositionedInternals.push(p); // Se não for estrutural, adia
                continue;
            }
            if (mesh) g.add(applyPartOverrides(mesh, mesh.userData.pecaNome, u));
        }
    });
    
    // Segundo, processa as peças com posição explícita e as distributivas
    const processarPeca = (p, index) => {
        const def = p.def;
        let dA = rF(def.altura, v), dL = rF(def.largura, v), esp = rF(def.espessura, v) || u.ei;
        let w, h, d, mesh;

        // Determina orientação e dimensões
        if (p.n.includes('prateleira')) {
            w = dL; h = esp; d = dA;
        } else { // divisoria, etc.
            w = esp; h = dA; d = dL;
        }

        if (def.posX || def.posY || def.posZ) {
            let posX = rF(def.posX || "0", v);
            let posY = rF(def.posY || "0", v);
            let posZ = rF(def.posZ || "0", v);
            mesh = ch(w, h, d, posX, posY, posZ, p.mat, `${def.nome} ${index + 1}`);
        }
        if (mesh) g.add(applyPartOverrides(mesh, mesh.userData.pecaNome.split(" ")[0], u));
    };
    
    unpositionedInternals.forEach(p => {
        for (let i = 0; i < p.q; i++) processarPeca(p, i);
    });


    // Terceiro, processa frentes (portas e gavetas)
    if (frentes.length > 0) {
        const portas = frentes.filter(f => f.n.includes('porta'));
        const gavetas = frentes.filter(f => !portas.includes(f));
        const folga = 2;

        if (portas.length > 0) {
            const p = portas[0];
            const numPortas = p.q;
            const h = rF(p.def.altura, v), d = rF(p.def.espessura,v) || u.ee;
            const aberturaTotalLargura = L - u.ei * 2;
            const portaW = (aberturaTotalLargura - (folga * (numPortas - 1))) / numPortas;
            
            let currentX = -aberturaTotalLargura / 2;

            for(let i=0; i<numPortas; i++){
                let isEsq = i < numPortas / 2;
                let pivotX = isEsq ? currentX : currentX + portaW;
                let pivotZ = P / 2 - u.ei;
                let posY = -A / 2 + hRod + h / 2;
                
                let pivot = new THREE.Group();
                pivot.position.set(pivotX, posY, pivotZ);
                pivot.userData.isPorta = true;
                pivot.userData.dirAb = isEsq ? 1 : -1;
                
                let portaMesh = ch(portaW, h, d, isEsq ? portaW / 2 : -portaW / 2, 0, 0, p.mat, `${p.def.nome} ${i+1}`);
                const puxador = criarPuxador(u.tipoPuxador, portaW, h, d, isEsq);
                if(puxador) portaMesh.add(puxador);
                
                pivot.add(portaMesh);
                g.add(pivot);
                currentX += portaW + folga;
            }
        }
        
        if (gavetas.length > 0) {
            let currentY = -A/2 + hRod;
            gavetas.forEach(p => {
                const h = rF(p.def.altura, v), w = rF(p.def.largura, v), d = rF(p.def.espessura,v) || u.ee;
                for(let i=0; i<p.q; i++){
                    let posX = 0, posY = currentY + h / 2, posZ = P / 2 - d / 2;
                    let pivot = new THREE.Group();
                    pivot.position.set(posX, posY, posZ);
                    pivot.userData.isGav = true;
                    let gavetaMesh = ch(w, h, d, 0, 0, 0, p.mat, `${p.def.nome} ${i+1}`);
                    const puxador = criarPuxador(u.tipoPuxador, w, h, d, false);
                    if(puxador) gavetaMesh.add(puxador);
                    pivot.add(gavetaMesh);
                    g.add(pivot);
                    currentY += h + folga;
                }
            });
        }
    }
    g.userData.aberto = u.aberto || false;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(L, A, P), new THREE.MeshBasicMaterial({ visible: false })));
}

function montarParede(g, L, A, P, sel = false) { const u = g.userData; g.clear(); let mat; if (u.texPar) mat = new THREE.MeshStandardMaterial({ map: loadTex(u.texPar, L / 1000, A / 1000), color: sel ? COR_SEL : (u.corPar || '#fff'), roughness: .9 }); else mat = new THREE.MeshStandardMaterial({ color: sel ? COR_SEL : (u.corPar || '#fff'), roughness: .9 }); const m = new THREE.Mesh(new THREE.BoxGeometry(L, A, P), mat); m.castShadow = true; m.receiveShadow = true; m.userData.pecaNome = 'parede'; addE(m); g.add(m); g.add(new THREE.Mesh(new THREE.BoxGeometry(L, A, P), new THREE.MeshBasicMaterial({ visible: false }))); }
function reconstruir(item, sel = false) { const u = item.userData; if (u.tipo === 'parede') montarParede(item, u.larg, u.alt, u.prof, sel); else if (u.tipoCanto === 'canto') montarCanto(item, sel, u.rx); else montarReto(item, u.larg, u.alt, u.prof, sel, u.rx, u.orig); }
function pintarMod(g, sel) { g.traverse(f => { if (!f.isMesh || !f.material || !f.material.visible || f === pecaAt) return; if (sel) f.material.color.set(COR_SEL); else { const u = g.userData; let isF = false, pai = f.parent; while (pai && pai !== g) { if (pai.userData.isPorta || pai.userData.isGav) isF = true; pai = pai.parent; } let ck = isF ? u.corE : u.corI; if (u.po && u.po[f.userData.pecaNome] && u.po[f.userData.pecaNome].ck) ck = u.po[f.userData.pecaNome].ck; f.material.color.set(C3D[ck] || '#d1d8e0'); } }); }

// === CATÁLOGO COM CATEGORIAS ===
const cBotoes = document.getElementById('lista-botoes'), catBar = document.getElementById('categorias-bar'), subcatBar = document.getElementById('subcategorias-bar');
let allMods = BD.catalogoModulos || []; let catMap = {};
allMods.forEach(mod => { const cat = (mod.categoria || 'Outros').trim(); const sub = (mod.subcategoria || 'Geral').trim(); if (!catMap[cat]) catMap[cat] = {}; if (!catMap[cat][sub]) catMap[cat][sub] = []; catMap[cat][sub].push(mod); });
let catAtiva = '', subAtiva = '';
function renderCats() { catBar.innerHTML = ''; const cats = Object.keys(catMap); if (!cats.length) { catBar.innerHTML = '<span style="font-size:9px;color:#999">Sem categorias</span>'; return; } cats.forEach(cat => { const b = document.createElement('div'); b.className = 'cat-btn' + (cat === catAtiva ? ' ativo' : ''); b.textContent = cat; b.addEventListener('click', () => { catAtiva = cat; subAtiva = ''; renderCats(); renderSubcats(); renderModulos(); }); catBar.appendChild(b); }); if (!catAtiva) catAtiva = cats[0]; }
function renderSubcats() { subcatBar.innerHTML = ''; if (!catMap[catAtiva]) return; const subs = Object.keys(catMap[catAtiva]); subs.forEach(sub => { const b = document.createElement('div'); b.className = 'subcat-btn' + (sub === subAtiva ? ' ativo' : ''); b.textContent = sub; b.addEventListener('click', () => { subAtiva = sub; renderSubcats(); renderModulos(); }); subcatBar.appendChild(b); }); if (!subAtiva && subs.length > 0) subAtiva = subs[0]; }
function renderModulos() { cBotoes.innerHTML = ''; let mods = []; if (catMap[catAtiva] && catMap[catAtiva][subAtiva]) mods = catMap[catAtiva][subAtiva]; else if (catMap[catAtiva]) Object.values(catMap[catAtiva]).forEach(a => mods.push(...a)); mods.forEach(mod => { let L = 800, A = 700, P = 500; const cat = (mod.categoria || '').toLowerCase(); const isCanto = (mod.tipo || '') === 'canto'; if (isCanto) { L = 950; A = cat.includes('sup') ? 700 : 800; P = 950; } else if (cat.includes('superior') || cat.includes('sup')) { A = 700; P = 350; } else if (cat.includes('quarto')) { L = 2000; A = 2200; P = 600; } else if (cat.includes('inferior')) { A = 800; P = 550; } const isUp = cat.includes('superior') || cat.includes('sup'); const btn = document.createElement('div'); btn.className = 'btn-mod'; btn.innerHTML = `<div class="btn-img-w">${mod.imagem ? `<img src="${mod.imagem}">` : '<span style="color:#aaa;font-size:9px">?</span>'}</div><div class="btn-nm">${mod.nome}</div><div class="btn-dim">${isCanto ? `${L}×${P}×${A}` : `${L}×${A}`}mm</div>`; btn.addEventListener('click', () => gerarItem(mod, L, A, P, isCanto, null, isUp ? 1500 : 0, null)); cBotoes.appendChild(btn); }); }
renderCats(); renderSubcats(); renderModulos();

function gerarItem(info, L, A, P, isCanto, px, py, pz) { const item = new THREE.Group(), cfg = BD.configCalculo || {}; item.userData = { larg: L, alt: A, prof: P, tipo: 'modulo', tipoCanto: isCanto ? 'canto' : 'reto', ladoA: isCanto ? L : 0, ladoB: isCanto ? P : 0, profA: isCanto ? 350 : 0, profB: isCanto ? 350 : 0, numPrateleiras: isCanto ? 1 : 0, elev: py || 0, rx: false, aberto: false, explodido: false, ei: cfg.espInterna || 15, ee: cfg.espExterna || 15, ef: cfg.espFundo || 6, corI: 'branco-tx', corE: 'branco-tx', tipoPuxador: 'perfil', orig: info, po: {}, corPar: '#fff', texPar: null, obs: '' }; item.position.set(px || (Math.random() * 300 - 150), (py || 0) + A / 2, pz || (Math.random() * 300 - 150)); reconstruir(item, false); cena.add(item); moveis.push(item); selecionar(item); clampDentroSala(item); }
function clampDentroSala(mov) { mov.updateMatrixWorld(true); const u = mov.userData, sB = getSalaBox(), oB = new THREE.Box3().setFromObject(mov), oS = new THREE.Vector3(), oC = new THREE.Vector3(); oB.getSize(oS); oB.getCenter(oC); const ox = mov.position.x - oC.x, oy = mov.position.y - oC.y, oz = mov.position.z - oC.z; let nx = mov.position.x, ny = mov.position.y, nz = mov.position.z; const hW = oS.x / 2, hH = oS.y / 2, hD = oS.z / 2, cx = nx - ox, cy = ny - oy, cz = nz - oz; if (cx - hW < sB.min.x) nx += (sB.min.x - (cx - hW)); if (cx + hW > sB.max.x) nx -= ((cx + hW) - sB.max.x); if (cz - hD < sB.min.z) nz += (sB.min.z - (cz - hD)); if (cz + hD > sB.max.z) nz -= ((cz + hD) - sB.max.z); if (cy - hH < 0) ny += (0 - (cy - hH)); if (cy + hH > SALA.a) ny -= ((cy + hH) - SALA.a); mov.position.set(nx, ny, nz); mov.updateMatrixWorld(true); const nb = new THREE.Box3().setFromObject(mov); u.elev = Math.max(0, nb.min.y); }
function checarCol(mov) { if (!colisaoAtiva) return false; mov.updateMatrixWorld(true); const bA = new THREE.Box3().setFromObject(mov).expandByScalar(-2); for (let m of moveis) { if (m === mov) continue; m.updateMatrixWorld(true); if (bA.intersectsBox(new THREE.Box3().setFromObject(m).expandByScalar(-2))) return true; } return false; }
function updStatus() { const stSel = document.getElementById('st-sel'), stPos = document.getElementById('st-pos'), stRot = document.getElementById('st-rot'); if (ativo) { const u = ativo.userData; const nm = u.orig ? u.orig.nome : (u.tipo === 'parede' ? 'Parede' : 'Módulo'); stSel.innerHTML = `<span class="status-sel">${nm}</span>`; stPos.innerText = `Pos: ${Math.round(ativo.position.x)}, ${Math.round(u.elev)}, ${Math.round(ativo.position.z)}`; stRot.innerText = `Rot: ${Math.round((ativo.rotation.y * 180 / Math.PI) % 360)}°`; } else { stSel.innerHTML = 'Nenhum'; stPos.innerText = 'Pos: -'; stRot.innerText = 'Rot: -'; } }
function resize() { setTimeout(() => { cam.aspect = cont.clientWidth / cont.clientHeight; cam.updateProjectionMatrix(); ren.setSize(cont.clientWidth, cont.clientHeight); }, 30); }

function preencher() {
    if (!ativo) return;
    const u = ativo.userData;
    document.getElementById('ed-l').value = u.larg;
    document.getElementById('ed-a').value = u.alt;
    document.getElementById('ed-p').value = u.prof;
    document.getElementById('ed-px').value = Math.round(ativo.position.x);
    document.getElementById('ed-pz').value = Math.round(ativo.position.z);
    document.getElementById('ed-y').value = Math.round(u.elev);
    const isPar = u.tipo === 'parede', isCanto = u.tipoCanto === 'canto';
    document.getElementById('lbl-p').innerText = isPar ? 'Espessura:' : 'Profundidade:';
    document.getElementById('gp-cor').style.display = isPar ? 'none' : '';
    document.getElementById('gp-esp').style.display = isPar ? 'none' : '';
    document.getElementById('gp-tpar').style.display = isPar ? '' : 'none';
    document.getElementById('gp-canto').style.display = isCanto ? '' : 'none';
    if (isCanto) { document.getElementById('ed-la').value = u.ladoA; document.getElementById('ed-lb').value = u.ladoB; document.getElementById('ed-pa').value = u.profA; document.getElementById('ed-pb').value = u.profB; }
    if (isPar) document.getElementById('ed-pcor').value = u.corPar || '#fff';
    if (!isPar) { document.getElementById('ed-ei').value = u.ei; document.getElementById('ed-ee').value = u.ee; document.getElementById('ed-ef').value = u.ef; document.getElementById('ed-ci').value = u.corI; document.getElementById('ed-ce').value = u.corE; document.getElementById('ed-pux').value = u.tipoPuxador || 'perfil'; }
    document.getElementById('ed-obs').value = u.obs || '';
    const imgBox = document.getElementById('prop-img-preview'); if (u.orig && u.orig.imagem) imgBox.innerHTML = `<img src="${u.orig.imagem}">`; else imgBox.innerHTML = '<span style="color:#ccc;font-size:20px">?</span>';
    atualizarAberturas();
    atualizarAgregados();
    document.getElementById('agr-nome-mod').innerText = u.orig ? u.orig.nome : (isPar ? 'Parede' : 'Módulo');
    updStatus();
}

function atualizarAberturas() { const lista = document.getElementById('aberturas-lista'); if (!ativo || ativo.userData.tipo === 'parede') { lista.innerHTML = '<span style="color:#999">Sem aberturas</span>'; return; } let portas = [], gavetas = []; ativo.children.forEach(c => { if (c.userData.isPorta) portas.push(c); if (c.userData.isGav) gavetas.push(c); }); if (!portas.length && !gavetas.length) { lista.innerHTML = '<span style="color:#999">Sem portas/gavetas</span>'; return; } let h = ''; portas.forEach((p, i) => h += `<div class="agr-item"><input type="checkbox" ${ativo.userData.aberto ? 'checked' : ''}><label>🚪 Porta ${i + 1}</label></div>`); gavetas.forEach((g, i) => h += `<div class="agr-item"><input type="checkbox" ${ativo.userData.aberto ? 'checked' : ''}><label>🗄️ Gaveta ${i + 1}</label></div>`); lista.innerHTML = h; }
function atualizarAgregados() { const lista = document.getElementById('agregados-lista'); if (!ativo || !ativo.userData.orig) { lista.innerHTML = '<span style="font-size:10px;color:#999">Sem agregados</span>'; atualizarMontagem(); return; } const u = ativo.userData; const isCanto = u.tipoCanto === 'canto'; let h = `<div class="agr-item"><input type="checkbox" checked disabled><label>Caixa (${isCanto ? 'Canto L' : 'Reto'})</label></div>`; if (isCanto) { h += `<div class="agr-item"><input type="checkbox" checked><label>Prateleira (L)</label><input type="number" id="agr-prat-qtd" value="${u.numPrateleiras || 1}" min="0" max="10" style="width:40px"></div>`; h += `<div class="agr-item"><input type="checkbox" checked disabled><label>Portas (2)</label></div>`; h += `<div class="agr-item"><input type="checkbox" checked disabled><label>Puxadores (2)</label></div>`; } lista.innerHTML = h; const pq = document.getElementById('agr-prat-qtd'); if (pq && isCanto) pq.addEventListener('change', () => { u.numPrateleiras = Math.max(0, +pq.value); reconstruir(ativo, true); }); atualizarMontagem(); }

function gerarMontagemTexto(mod) {
    if (!mod || !mod.pecas || !mod.pecas.length) return 'Módulo sem especificação de peças.';
    const lines = [];
    lines.push(`Módulo: ${mod.nome || 'sem nome'}`);
    lines.push(`Categoria: ${mod.categoria || 'não definida'}`);
    lines.push('---');
    lines.push('Peças listadas:');
    mod.pecas.forEach(p => {
        const qtd = p.qtd || '1';
        const nome = p.nome || 'Peça';
        const alt = p.altura ? `Altura: ${p.altura}` : '';
        const larg = p.largura ? `Largura: ${p.largura}` : '';
        const esp = p.espessura ? `Espessura: ${p.espessura}` : '';
        const material = p.tipoMaterial ? `Material: ${p.tipoMaterial}` : '';
        const info = [alt, larg, esp, material].filter(Boolean).join(' | ');
        lines.push(`${qtd}x ${nome}${info ? ' (' + info + ')' : ''}`);
    });

    const temPortas = mod.pecas.some(p => /porta/i.test(p.nome));
    const temGavetas = mod.pecas.some(p => /gaveta/i.test(p.nome));
    if (!temPortas) lines.push('0x Porta (sem portas no módulo)');
    if (!temGavetas) lines.push('0x Gaveta (sem gavetas no módulo)');

    lines.push('---');
    lines.push('Passo a passo de montagem:');
    lines.push('1. Preparar superfície e separá-las por peça (lat-d, lat-e, base sup, base inf, prateleira, fundo).');
    lines.push('2. Montar as laterais (direita e esquerda) na posição; fixar com parafusos e buchas.');
    lines.push('3. Encaixar base inferior e superior entre as laterais, garantindo esquadro.');
    lines.push('4. Inserir fundo (fundo) e fixar com parafusos/grampos.');
    lines.push('5. Instalar prateleiras na altura desejada (ou definida no módulo).');
    if (temPortas) lines.push('6. Instalar portas externas com dobradiças; ajustar abertura.');
    if (!temPortas) lines.push('6. (Sem porta) Verificar frontal e acabamento.');
    if (temGavetas) lines.push('7. Inserir gavetas e trilhos; testar deslizamento.');
    lines.push('8. Verificar nivelamento e finalização de bordas / puxadores.');

    lines.push('---');
    lines.push('Itens recomendados de fixação:');
    lines.push('- Régua frontal');
    lines.push('- Travessas/travas');
    lines.push('- Chumbadores');
    lines.push('- Parafusos 4x16, 4x40, 5x70 (conforme projeto)');

    return lines.join('\n');
}

function atualizarMontagem() { const el = document.getElementById('montagem-lista'); if (!el) return; if (!ativo || !ativo.userData || !ativo.userData.orig) { el.textContent = 'Selecione um módulo para ver a montagem.'; return; } el.textContent = gerarMontagemTexto(ativo.userData.orig); }

document.getElementById('btn-montagem').addEventListener('click', atualizarMontagem);

function soltarPeca() {
    if (pecaAt && matOrig) { pecaAt.material = matOrig; if (ativo) pintarMod(ativo, true); }
    pecaAt = null; matOrig = null;
    document.getElementById('painel-peca').style.display = 'none';
    ctrlArr.detach();
    if (ativo) ctrlArr.attach(ativo);
    ctrlArr.mode = 'translate';
    avisoEl.innerText = 'Clique:Seleciona | DupClique:Edita Peça | Ctrl+Arraste:Ignora colisão';
}

function selecionar(mov) { if (ativo && ativo !== mov) { if (ativo.userData.tipo === 'parede') reconstruir(ativo, false); else pintarMod(ativo, false); } soltarPeca(); ativo = mov; const p = document.getElementById('painel-ed'); if (ativo) { if (ativo.userData.tipo === 'parede') reconstruir(ativo, true); else pintarMod(ativo, true); preencher(); ctrlArr.attach(ativo); if (p.style.display !== 'block') { p.style.display = 'block'; resize(); } document.querySelectorAll('.ferr-aba').forEach(a => a.classList.remove('ativo')); document.querySelectorAll('.ferr-painel').forEach(pp => pp.classList.remove('ativo')); document.querySelector('.ferr-aba[data-tab="propriedades"]').classList.add('ativo'); document.getElementById('tab-propriedades').classList.add('ativo'); document.getElementById('ferr-nome-titulo').innerText = 'Propriedades'; } else { ctrlArr.detach(); if (p.style.display === 'block') { p.style.display = 'none'; resize(); } } updStatus(); }

// === CONTROLES ===
const ctrlCam = new OrbitControls(cam, ren.domElement); ctrlCam.enableDamping = true; ctrlCam.dampingFactor = .08; ctrlCam.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
const ctrlArr = new TransformControls(cam, ren.domElement); let arrastando = false, posSeg = new THREE.Vector3();
ctrlArr.addEventListener('dragging-changed', e => { ctrlCam.enabled = !e.value; arrastando = e.value; if (e.value && ctrlArr.object) posSeg.copy(ctrlArr.object.position); });
ctrlArr.addEventListener('change', () => { if (!ativo) return; const obj = ctrlArr.object; if (!obj) return; if (obj === ativo) { clampDentroSala(ativo); if (!ctrlKey && colisaoAtiva) { if (checarCol(ativo)) ativo.position.copy(posSeg); else posSeg.copy(ativo.position); } else posSeg.copy(ativo.position); document.getElementById('ed-px').value = Math.round(ativo.position.x); document.getElementById('ed-pz').value = Math.round(ativo.position.z); document.getElementById('ed-y').value = Math.round(ativo.userData.elev); } else if (obj === pecaAt) { const u = ativo.userData, pn = pecaAt.userData.pecaNome; if (!u.po) u.po = {}; if (!u.po[pn]) u.po[pn] = {}; u.po[pn].px = pecaAt.position.x; u.po[pn].py = pecaAt.position.y; u.po[pn].pz = pecaAt.position.z; u.po[pn].rx = pecaAt.rotation.x; u.po[pn].ry = pecaAt.rotation.y; u.po[pn].rz = pecaAt.rotation.z; document.getElementById('ep-px').value = Math.round(pecaAt.position.x); document.getElementById('ep-py').value = Math.round(pecaAt.position.y); document.getElementById('ep-pz').value = Math.round(pecaAt.position.z); document.getElementById('ep-rx').value = (pecaAt.rotation.x * 180 / Math.PI).toFixed(1); document.getElementById('ep-ry').value = (pecaAt.rotation.y * 180 / Math.PI).toFixed(1); document.getElementById('ep-rz').value = (pecaAt.rotation.z * 180 / Math.PI).toFixed(1); } updStatus(); });
cena.add(ctrlArr);
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let mX = 0, mY = 0;
ren.domElement.addEventListener('pointerdown', e => { mX = e.clientX; mY = e.clientY; });
ren.domElement.addEventListener('pointerup', e => { if (arrastando || e.button !== 0 || Math.abs(e.clientX - mX) + Math.abs(e.clientY - mY) > 5) return; const r = ren.domElement.getBoundingClientRect(); mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1; mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1; ray.setFromCamera(mouse, cam); const ints = ray.intersectObjects(moveis, true); if (ints.length > 0) { let m = ints[0].object; while (m.parent && !moveis.includes(m)) m = m.parent; if (ativo !== m) selecionar(m); else soltarPeca(); } else selecionar(null); });
ren.domElement.addEventListener('dblclick', e => { const r = ren.domElement.getBoundingClientRect(); mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1; mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1; ray.setFromCamera(mouse, cam); const ints = ray.intersectObjects(moveis, true); const v = ints.find(i => i.object.type !== 'LineSegments' && i.object.material && i.object.material.visible && i.object.userData.pecaNome); if (v) { let p = v.object; if (p.userData.pecaNome === 'parede') return; let m = p; while (m.parent && !moveis.includes(m)) m = m.parent; if (ativo !== m) selecionar(m); soltarPeca(); pecaAt = p; matOrig = p.material; p.material = MAT_SEL; ctrlArr.mode = 'translate'; ctrlArr.attach(p); avisoEl.innerText = `Movendo: ${p.userData.pecaNome}`; document.getElementById('ep-l').value = Math.round(p.geometry.parameters?.width || 0); document.getElementById('ep-a').value = Math.round(p.geometry.parameters?.height || 0); document.getElementById('ep-p').value = Math.round(p.geometry.parameters?.depth || 0); document.getElementById('ep-px').value = Math.round(p.position.x); document.getElementById('ep-py').value = Math.round(p.position.y); document.getElementById('ep-pz').value = Math.round(p.position.z); document.getElementById('ep-rx').value = (p.rotation.x * 180 / Math.PI).toFixed(1); document.getElementById('ep-ry').value = (p.rotation.y * 180 / Math.PI).toFixed(1); document.getElementById('ep-rz').value = (p.rotation.z * 180 / Math.PI).toFixed(1); document.getElementById('painel-peca').style.display = 'block'; } });

// === PEÇA INPUTS ===
document.getElementById('btn-mover-peca').addEventListener('click', () => { if (pecaAt) ctrlArr.mode = 'translate'; });
document.getElementById('btn-girar-peca').addEventListener('click', () => { if (pecaAt) ctrlArr.mode = 'rotate'; });
document.getElementById('btn-salvar-peca').addEventListener('click', () => { if (!pecaAt || !ativo) return; if (pecaAt.geometry.parameters) { pecaAt.geometry.dispose(); pecaAt.geometry = new THREE.BoxGeometry(+document.getElementById('ep-l').value, +document.getElementById('ep-a').value, +document.getElementById('ep-p').value); const la = pecaAt.children.find(f => f.type === 'LineSegments'); if (la) { pecaAt.remove(la); la.geometry.dispose(); la.material.dispose(); } pecaAt.add(new THREE.LineSegments(new THREE.EdgesGeometry(pecaAt.geometry), new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: .35 }))); } const pn = pecaAt.userData.pecaNome, nk = document.getElementById('ep-cor').value; if (!ativo.userData.po) ativo.userData.po = {}; if (!ativo.userData.po[pn]) ativo.userData.po[pn] = {}; ativo.userData.po[pn].ck = nk; pintarMod(ativo, true); });
['px', 'py', 'pz'].forEach(axis => { document.getElementById(`ep-${axis}`).addEventListener('input', e => { if (!pecaAt || !ativo) return; const val = parseFloat(e.target.value) || 0; pecaAt.position[axis.slice(-1)] = val; const u = ativo.userData, pn = pecaAt.userData.pecaNome; if (!u.po) u.po = {}; if (!u.po[pn]) u.po[pn] = {}; u.po[pn][`p${axis.slice(-1)}`] = val; }); });
['rx', 'ry', 'rz'].forEach(axis => { document.getElementById(`ep-${axis}`).addEventListener('input', e => { if (!pecaAt || !ativo) return; const valRad = (parseFloat(e.target.value) || 0) * Math.PI / 180; pecaAt.rotation[axis.slice(-1)] = valRad; const u = ativo.userData, pn = pecaAt.userData.pecaNome; if (!u.po) u.po = {}; if (!u.po[pn]) u.po[pn] = {}; u.po[pn][axis] = valRad; }); });
document.getElementById('btn-reset-peca').addEventListener('click', () => { if (!pecaAt || !ativo) return; const u = ativo.userData, pn = pecaAt.userData.pecaNome; if (u.po && u.po[pn]) { delete u.po[pn].px; delete u.po[pn].py; delete u.po[pn].pz; delete u.po[pn].rx; delete u.po[pn].ry; delete u.po[pn].rz; } const ref = ativo; soltarPeca(); reconstruir(ref, true); selecionar(ref); });

// === BOTÕES PRINCIPAIS ===
document.getElementById('btn-salvar').addEventListener('click', () => { if (!ativo) return; const u = ativo.userData; u.larg = +document.getElementById('ed-l').value; u.alt = +document.getElementById('ed-a').value; u.prof = +document.getElementById('ed-p').value; u.elev = +document.getElementById('ed-y').value || 0; ativo.position.x = +document.getElementById('ed-px').value; ativo.position.z = +document.getElementById('ed-pz').value; ativo.position.y = u.elev + (u.alt / 2); if (u.tipoCanto === 'canto') { u.ladoA = +document.getElementById('ed-la').value; u.ladoB = +document.getElementById('ed-lb').value; u.profA = +document.getElementById('ed-pa').value; u.profB = +document.getElementById('ed-pb').value; u.larg = u.ladoA; u.prof = u.ladoB; } if (u.tipo === 'parede') u.corPar = document.getElementById('ed-pcor').value; else { u.ei = +document.getElementById('ed-ei').value; u.ee = +document.getElementById('ed-ee').value; u.ef = +document.getElementById('ed-ef').value; u.corI = document.getElementById('ed-ci').value; u.corE = document.getElementById('ed-ce').value; u.tipoPuxador = document.getElementById('ed-pux').value; } u.obs = document.getElementById('ed-obs').value; soltarPeca(); reconstruir(ativo, true); clampDentroSala(ativo); preencher(); });
document.getElementById('btn-girar').addEventListener('click', () => { if (ativo) { ativo.rotation.y += Math.PI / 2; clampDentroSala(ativo); preencher(); } });
document.getElementById('btn-raiox').addEventListener('click', () => { if (ativo) { ativo.userData.rx = !ativo.userData.rx; reconstruir(ativo, true); } });
document.getElementById('btn-abrir').addEventListener('click', () => { if (ativo) { ativo.userData.aberto = !ativo.userData.aberto; atualizarAberturas(); } });
document.getElementById('btn-abrir-tudo').addEventListener('click', () => { if (ativo) { ativo.userData.aberto = true; atualizarAberturas(); } });
document.getElementById('btn-fechar-tudo').addEventListener('click', () => { if (ativo) { ativo.userData.aberto = false; atualizarAberturas(); } });
document.getElementById('btn-excluir').addEventListener('click', () => { if (ativo) { soltarPeca(); ctrlArr.detach(); cena.remove(ativo); moveis.splice(moveis.indexOf(ativo), 1); selecionar(null); } });
document.getElementById('btn-duplicar').addEventListener('click', () => { if (!ativo) return; const n = new THREE.Group(); n.userData = JSON.parse(JSON.stringify(ativo.userData)); n.position.set(ativo.position.x + 150, ativo.position.y, ativo.position.z + 150); n.rotation.y = ativo.rotation.y; reconstruir(n, false); cena.add(n); moveis.push(n); selecionar(n); clampDentroSala(n); });
document.getElementById('btn-explodir').addEventListener('click', () => { if (ativo) ativo.userData.explodido = !ativo.userData.explodido; });
document.getElementById('btn-nova-par').addEventListener('click', () => { const item = new THREE.Group(); item.userData = { larg: 2000, alt: SALA.a, prof: 150, tipo: 'parede', tipoCanto: 'reto', elev: 0, rx: false, aberto: false, po: {}, corPar: '#fff', texPar: null, ei: 15, ee: 15, ef: 6, corI: 'branco-tx', corE: 'branco-tx', orig: null, obs: '' }; item.position.set(0, SALA.a / 2, 0); reconstruir(item, false); cena.add(item); moveis.push(item); selecionar(item); clampDentroSala(item); });
document.getElementById('btn-limpar').addEventListener('click', () => { if (!confirm("Limpar tudo?")) return; soltarPeca(); selecionar(null); moveis.forEach(m => cena.remove(m)); moveis.length = 0; });

// === MOVIMENTAÇÃO ===
function moverAtivo(dx, dy, dz) { if (!ativo) return; const p = +(document.getElementById('mov-passo').value) || 10; ativo.position.x += dx * p; ativo.position.y += dy * p; ativo.position.z += dz * p; clampDentroSala(ativo); preencher(); }
document.getElementById('mv-fwd').addEventListener('click', () => moverAtivo(0, 0, -1));
document.getElementById('mv-back').addEventListener('click', () => moverAtivo(0, 0, 1));
document.getElementById('mv-left').addEventListener('click', () => moverAtivo(-1, 0, 0));
document.getElementById('mv-right').addEventListener('click', () => moverAtivo(1, 0, 0));
document.getElementById('mv-up').addEventListener('click', () => moverAtivo(0, 1, 0));
document.getElementById('mv-down').addEventListener('click', () => moverAtivo(0, -1, 0));
document.getElementById('rot-esq').addEventListener('click', () => { if (ativo) { ativo.rotation.y -= (+(document.getElementById('rot-ang').value) || 90) * Math.PI / 180; clampDentroSala(ativo); preencher(); } });
document.getElementById('rot-dir').addEventListener('click', () => { if (ativo) { ativo.rotation.y += (+(document.getElementById('rot-ang').value) || 90) * Math.PI / 180; clampDentroSala(ativo); preencher(); } });

// === SNAP/POSICIONAMENTO ===
document.getElementById('snap-parede-fundo').addEventListener('click', () => { if (!ativo) return; ativo.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(ativo), s = new THREE.Vector3(); b.getSize(s); ativo.position.z = -SALA.p / 2 + s.z / 2; clampDentroSala(ativo); preencher(); });
document.getElementById('snap-parede-esq').addEventListener('click', () => { if (!ativo) return; ativo.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(ativo), s = new THREE.Vector3(); b.getSize(s); ativo.position.x = -SALA.l / 2 + s.x / 2; clampDentroSala(ativo); preencher(); });
document.getElementById('snap-parede-dir').addEventListener('click', () => { if (!ativo) return; ativo.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(ativo), s = new THREE.Vector3(); b.getSize(s); ativo.position.x = SALA.l / 2 - s.x / 2; clampDentroSala(ativo); preencher(); });
document.getElementById('snap-chao').addEventListener('click', () => { if (!ativo) return; ativo.userData.elev = 0; ativo.position.y = ativo.userData.alt / 2; clampDentroSala(ativo); preencher(); });
document.getElementById('snap-centro').addEventListener('click', () => { if (!ativo) return; ativo.position.x = 0; ativo.position.z = 0; clampDentroSala(ativo); preencher(); });
document.getElementById('snap-canto-esq').addEventListener('click', () => { if (!ativo) return; ativo.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(ativo), s = new THREE.Vector3(); b.getSize(s); ativo.position.x = -SALA.l / 2 + s.x / 2; ativo.position.z = -SALA.p / 2 + s.z / 2; clampDentroSala(ativo); preencher(); });
document.getElementById('snap-canto-dir').addEventListener('click', () => { if (!ativo) return; ativo.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(ativo), s = new THREE.Vector3(); b.getSize(s); ativo.position.x = SALA.l / 2 - s.x / 2; ativo.position.z = -SALA.p / 2 + s.z / 2; clampDentroSala(ativo); preencher(); });
document.getElementById('alin-adj-esq').addEventListener('click', () => { if (!ativo || moveis.length < 2) return; let closest = null, dist = Infinity; const ab = new THREE.Box3().setFromObject(ativo); moveis.forEach(m => { if (m === ativo) return; const mb = new THREE.Box3().setFromObject(m); const d = ab.min.x - mb.max.x; if (d >= 0 && d < dist) { dist = d; closest = m; } }); if (closest) { const mb = new THREE.Box3().setFromObject(closest), as = new THREE.Vector3(); ab.getSize(as); ativo.position.x = mb.max.x + as.x / 2; clampDentroSala(ativo); preencher(); } });
document.getElementById('alin-adj-dir').addEventListener('click', () => { if (!ativo || moveis.length < 2) return; let closest = null, dist = Infinity; const ab = new THREE.Box3().setFromObject(ativo); moveis.forEach(m => { if (m === ativo) return; const mb = new THREE.Box3().setFromObject(m); const d = mb.min.x - ab.max.x; if (d >= 0 && d < dist) { dist = d; closest = m; } }); if (closest) { const mb = new THREE.Box3().setFromObject(closest), as = new THREE.Vector3(); ab.getSize(as); ativo.position.x = mb.min.x - as.x / 2; clampDentroSala(ativo); preencher(); } });
document.getElementById('alin-empilhar').addEventListener('click', () => { if (!ativo || moveis.length < 2) return; let below = null, minDist = Infinity; const ab = new THREE.Box3().setFromObject(ativo); moveis.forEach(m => { if (m === ativo) return; const mb = new THREE.Box3().setFromObject(m); if (Math.abs(m.position.x - ativo.position.x) < ativo.userData.larg && Math.abs(m.position.z - ativo.position.z) < ativo.userData.prof) { const d = ab.min.y - mb.max.y; if (d >= -5 && d < minDist) { minDist = d; below = m; } } }); if (below) { const mb = new THREE.Box3().setFromObject(below); ativo.userData.elev = mb.max.y; ativo.position.y = mb.max.y + ativo.userData.alt / 2; clampDentroSala(ativo); preencher(); } });

// === ARRANJO ===
document.getElementById('btn-inserir-arr').addEventListener('click', () => { if (!ativo) return; const isLinear = document.querySelector('.arr-tab.ativo').dataset.arrt === 'linear'; if (isLinear) { const qx = +(document.getElementById('arr-x-val').value) || 1; const qz = +(document.getElementById('arr-z-val').value) || 1; const incX = +(document.getElementById('arr-inc-x').value) || 0; const incZ = +(document.getElementById('arr-inc-z').value) || 0; const u = ativo.userData; const stepX = u.larg + incX; const stepZ = u.prof + incZ; for (let ix = 0; ix < qx; ix++) { for (let iz = 0; iz < qz; iz++) { if (ix === 0 && iz === 0) continue; const n = new THREE.Group(); n.userData = JSON.parse(JSON.stringify(u)); n.position.set(ativo.position.x + ix * stepX, ativo.position.y, ativo.position.z + iz * stepZ); n.rotation.y = ativo.rotation.y; reconstruir(n, false); cena.add(n); moveis.push(n); clampDentroSala(n); } } } else { const raio = +(document.getElementById('arr-raio').value) || 500; const qtd = +(document.getElementById('arr-pol-qtd').value) || 4; const angTot = (+(document.getElementById('arr-pol-ang').value) || 360) * Math.PI / 180; const u = ativo.userData; for (let i = 1; i < qtd; i++) { const ang = (angTot / qtd) * i; const n = new THREE.Group(); n.userData = JSON.parse(JSON.stringify(u)); n.position.set(ativo.position.x + Math.cos(ang) * raio, ativo.position.y, ativo.position.z + Math.sin(ang) * raio); n.rotation.y = ativo.rotation.y + ang; reconstruir(n, false); cena.add(n); moveis.push(n); clampDentroSala(n); } } });

// === BOTTOM TOOLS ===
document.getElementById('bt-colisao').addEventListener('click', function() { colisaoAtiva = !colisaoAtiva; this.classList.toggle('ativo'); });

// === SALVAR/CARREGAR PROJETO ===
document.getElementById('btn-salvar-proj').addEventListener('click', () => { if (!confirm("Salvar projeto?")) return; try { const d = { sala: SALA, bg: cena.background.getHexString(), moveis: moveis.map(m => ({ userData: m.userData, position: { x: m.position.x, y: m.position.y, z: m.position.z }, rotation: { y: m.rotation.y } })) }; localStorage.setItem('projeto3d-salvo', JSON.stringify(d)); alert("Projeto salvo!"); } catch (e) { alert("Erro ao salvar: " + e.message); } });
document.getElementById('btn-carregar-proj').addEventListener('click', () => { const ds = localStorage.getItem('projeto3d-salvo'); if (!ds) { alert("Nenhum projeto salvo."); return; } if (!confirm("Carregar projeto? Trabalho atual será perdido.")) return; try { const d = JSON.parse(ds); selecionar(null); moveis.forEach(m => cena.remove(m)); moveis.length = 0; Object.assign(SALA, d.sala); construirSala(); document.getElementById('s-larg').value = SALA.l; document.getElementById('s-prof').value = SALA.p; document.getElementById('s-alt').value = SALA.a; document.getElementById('s-esp').value = SALA.e; document.getElementById('s-teto').value = SALA.teto ? '1' : '0'; document.getElementById('s-npar').value = SALA.npar; cena.background.set('#' + d.bg); d.moveis.forEach(is => { const n = new THREE.Group(); n.userData = is.userData; n.position.set(is.position.x, is.position.y, is.position.z); n.rotation.y = is.rotation.y; reconstruir(n, false); cena.add(n); moveis.push(n); }); alert("Projeto carregado!"); } catch (e) { alert("Erro: " + e.message); } });

// === TEXTURAS ===
let texAlvo = null;
function abrirMT(alvo) { texAlvo = alvo; let texs = [], t = ''; if (alvo === 'piso') { texs = TEX_PISO; t = 'Piso'; } else if (alvo === 'parede' || alvo === 'par-mov') { texs = TEX_PAR; t = 'Paredes'; } else { texs = TEX_TETO; t = 'Teto'; } document.getElementById('mt-titulo').innerText = t; let h = '<div class="ts"><h3>Cores</h3><div class="tg">'; CORES_SOL.forEach(c => { h += `<div class="tc" data-cor="${c.c}"><div class="cc" style="background:${c.c};border:1px solid #ddd"></div><div class="tn">${c.n}</div></div>`; }); h += '</div></div><div class="ts"><h3>Texturas</h3><div class="tg">'; texs.forEach(tx => { h += `<div class="tc" data-url="${tx.u}"><img src="${tx.u}"><div class="tn">${tx.n}</div></div>`; }); h += '</div></div>'; document.getElementById('mt-corpo').innerHTML = h; document.querySelectorAll('#mt-corpo .tc').forEach(el => el.addEventListener('click', () => { document.getElementById('modal-tex').style.display = 'none'; })); document.getElementById('modal-tex').style.display = 'flex'; }
document.getElementById('btn-mt-url').addEventListener('click', () => { document.getElementById('modal-tex').style.display = 'none'; });
document.getElementById('btn-tex-piso').addEventListener('click', () => abrirMT('piso'));
document.getElementById('btn-tex-par').addEventListener('click', () => abrirMT('parede'));
document.getElementById('btn-tex-teto').addEventListener('click', () => abrirMT('teto'));
document.getElementById('btn-ptex')?.addEventListener('click', () => abrirMT('par-mov'));
document.getElementById('btn-cor-bg').addEventListener('click', () => { const g = document.getElementById('bg-grid'); g.innerHTML = ''; CORES_BG.forEach(c => { const d = document.createElement('div'); d.className = 'tc'; d.innerHTML = `<div class="cc" style="background:${c.c};border:1px solid #555"></div><div class="tn">${c.n}</div>`; d.addEventListener('click', () => { cena.background = new THREE.Color(c.c); document.getElementById('modal-bg').style.display = 'none'; }); g.appendChild(d); }); document.getElementById('modal-bg').style.display = 'flex'; });
document.getElementById('bg-custom').addEventListener('input', e => { cena.background = new THREE.Color(e.target.value); });
document.getElementById('btn-cfg-sala').addEventListener('click', () => { const p = document.getElementById('painel-amb'); p.style.display = p.style.display === 'none' ? 'block' : 'none'; });
document.getElementById('btn-app-sala').addEventListener('click', () => { SALA.l = +document.getElementById('s-larg').value || 4000; SALA.p = +document.getElementById('s-prof').value || 4000; SALA.a = +document.getElementById('s-alt').value || 2800; SALA.e = +document.getElementById('s-esp').value || 100; SALA.teto = document.getElementById('s-teto').value === '1'; SALA.npar = +document.getElementById('s-npar').value || 2; construirSala(); moveis.forEach(m => clampDentroSala(m)); });
document.getElementById('btn-del-par-fixa').addEventListener('click', () => { const corpo = document.getElementById('parfix-corpo'); const nomes = { fundo: 'Fundo', esq: 'Esquerda', dir: 'Direita', frente: 'Frontal' }; let h = ''; paredesFixas.forEach((pf, i) => { h += `<div style="display:flex;align-items:center;gap:8px;padding:6px;margin-bottom:4px;background:#f8f9fa;border-radius:4px;border:1px solid #ddd"><span style="font-weight:700;font-size:11px;min-width:70px">🧱${nomes[pf.lado]}</span><label style="font-size:10px"><input type="checkbox" data-idx="${i}" class="pf-vis" ${pf.visivel ? 'checked' : ''}> Vis</label><input type="color" data-idx="${i}" class="pf-cor" value="${pf.cor}" style="width:30px;height:22px"></div>`; }); h += `<button id="btn-app-pf" style="width:100%;padding:7px;background:#6c5ce7;color:#fff;border:none;border-radius:3px;cursor:pointer;font-weight:700;margin-top:8px">✔ Aplicar</button>`; corpo.innerHTML = h; corpo.querySelector('#btn-app-pf').addEventListener('click', () => { corpo.querySelectorAll('.pf-vis').forEach(cb => { paredesFixas[+cb.dataset.idx].visivel = cb.checked; }); corpo.querySelectorAll('.pf-cor').forEach(inp => { paredesFixas[+inp.dataset.idx].cor = inp.value; }); gSala.clear(); const L = SALA.l, P = SALA.p, A = SALA.a, E = SALA.e; const pp = new THREE.Mesh(new THREE.BoxGeometry(L + E * 2, 20, P + E * 2), matS('#c8a97e')); pp.position.y = -10; addE(pp); gSala.add(pp); const gr = new THREE.GridHelper(Math.max(L, P) * 1.3, Math.max(L, P) / 100, 0x444444, 0x333333); gr.position.y = 1; gr.material.opacity = .12; gr.material.transparent = true; gSala.add(gr); paredesFixas.forEach(pf => { if (!pf.visivel) return; pf.mesh.material.dispose(); pf.mesh.material = matS(pf.cor); const ol = pf.mesh.children.filter(c => c.type === 'LineSegments'); ol.forEach(l => { pf.mesh.remove(l); l.geometry.dispose(); l.material.dispose(); }); addE(pf.mesh); gSala.add(pf.mesh); }); if (SALA.teto) { const t = new THREE.Mesh(new THREE.BoxGeometry(L + E * 2, 20, P + E * 2), matS('#f5f6fa')); t.position.y = A + 10; addE(t); gSala.add(t); } document.getElementById('modal-parfix').style.display = 'none'; }); document.getElementById('modal-parfix').style.display = 'flex'; });

// === RELATÓRIOS ===
const inpCli = document.querySelectorAll('.inp-cli'), inpAmb = document.querySelectorAll('.inp-amb'), outCli = document.querySelectorAll('.out-cli'), outAmb = document.querySelectorAll('.out-amb');
inpCli.forEach(i => i.addEventListener('input', e => { inpCli.forEach(x => x.value = e.target.value); outCli.forEach(x => x.innerText = e.target.value); }));
inpAmb.forEach(i => i.addEventListener('input', e => { inpAmb.forEach(x => x.value = e.target.value); outAmb.forEach(x => x.innerText = e.target.value); }));
function updCab() { outCli.forEach(x => x.innerText = inpCli[0].value || 'Cliente'); outAmb.forEach(x => x.innerText = inpAmb[0].value || 'Ambiente'); }
document.getElementById('btn-rel').addEventListener('click', () => { const tMDF = {}, tFita = {}, tFerr = {}; moveis.forEach(m => { const u = m.userData; if (u.tipo === 'parede' || !u.orig || !u.orig.pecas) return; const v = getVars(u); u.orig.pecas.forEach(p => { const q = Math.round(rF(p.qtd || "1", v)); if (q <= 0) return; const alt = rF(p.altura, v), larg = rF(p.largura, v); let e = u.ei, c = u.corI; const t = (p.tipoMaterial || "interna").toLowerCase(); if (t === 'externa') { e = u.ee; c = u.corE; } else if (t === 'fundo') e = u.ef; if (p.espessura && !isNaN(+p.espessura)) e = +p.espessura; const cMDF = `${c}(${e}mm)`; if (!tMDF[cMDF]) tMDF[cMDF] = { nome: BD.coresMDF[c]?.nome || c, esp: e, m2: 0 }; tMDF[cMDF].m2 += (alt * larg * q) / 1e6; let pFita = 0; if (p.bordaA1) pFita += (alt * q); if (p.bordaA2) pFita += (alt * q); if (p.bordaL1) pFita += (larg * q); if (p.bordaL2) pFita += (larg * q); if (pFita > 0) { if (!tFita[c]) tFita[c] = { nome: BD.coresMDF[c]?.nome || c, metros: 0 }; tFita[c].metros += (pFita / 1000); } if (p.ferragensAssociadas) p.ferragensAssociadas.forEach(f => { const qF = rF(f.qtdFormula || "1", v) * q; if (qF > 0) tFerr[f.key] = (tFerr[f.key] || 0) + qF; }); }); if (u.orig.ferragens) u.orig.ferragens.forEach(f => { const qF = f.valor || rF(f.qtdFormula || "1", v); if (qF > 0) tFerr[f.key] = (tFerr[f.key] || 0) + qF; }); if (u.orig.corredicas) u.orig.corredicas.forEach(c => { const qF = rF(c.qtdFormula || "1", v); if (qF > 0) tFerr[c.key] = (tFerr[c.key] || 0) + qF; }); }); let html = `<h3>📦 Chapas MDF</h3><table class="orc-tab"><tr><th>Material</th><th>Esp</th><th>m²</th></tr>`; for (let k in tMDF) html += `<tr><td>${tMDF[k].nome}</td><td>${tMDF[k].esp}mm</td><td>${tMDF[k].m2.toFixed(2)}</td></tr>`; html += `</table><h3>🎗️ Fita de Borda</h3><table class="orc-tab"><tr><th>Cor</th><th>Metros</th></tr>`; for (let k in tFita) html += `<tr><td>${tFita[k].nome}</td><td>${tFita[k].metros.toFixed(2)}m</td></tr>`; html += `</table><h3>🔩 Ferragens</h3><table class="orc-tab"><tr><th>Item</th><th>Qtd</th></tr>`; for (let k in tFerr) { const inf = BD.catalogoFerragens[k]; html += `<tr><td>${inf ? inf.nome : k}</td><td>${Math.ceil(tFerr[k])} ${inf ? inf.unidade : 'UN'}</td></tr>`; } html += `</table>`; if (!Object.keys(tMDF).length) html = "<p>Nenhum móvel.</p>"; document.getElementById('rel-corpo').innerHTML = html; document.getElementById('modal-rel').style.display = 'flex'; });
function calcPreco(u) { if (u.tipo === 'parede' || !u.orig) return 0; const v = getVars(u); let cTot = 0; if (u.orig.pecas) u.orig.pecas.forEach(p => { const q = rF(p.qtd || "1", v); if (q <= 0) return; const m2 = (rF(p.altura, v) * rF(p.largura, v) * q) / 1e6; let cP = u.corI; if ((p.tipoMaterial || "interna").toLowerCase() === 'externa') cP = u.corE; cTot += m2 * (BD.coresMDF[cP]?.preco || 150); let pF = 0; if (p.bordaA1) pF += rF(p.altura, v) * q; if (p.bordaA2) pF += rF(p.altura, v) * q; if (p.bordaL1) pF += rF(p.largura, v) * q; if (p.bordaL2) pF += rF(p.largura, v) * q; cTot += (pF / 1000) * (BD.coresBorda[cP]?.preco || 2.5); if (p.ferragensAssociadas) p.ferragensAssociadas.forEach(f => { const qF = rF(f.qtdFormula || "1", v) * q; if (qF > 0) cTot += qF * (BD.catalogoFerragens[f.key]?.preco || 0); }); }); if (u.orig.ferragens) u.orig.ferragens.forEach(f => { const qF = f.valor || rF(f.qtdFormula || "1", v); if (qF > 0) cTot += qF * (BD.catalogoFerragens[f.key]?.preco || 0); }); if (u.orig.corredicas) u.orig.corredicas.forEach(c => { const qF = rF(c.qtdFormula || "1", v); if (qF > 0) cTot += qF * (BD.catalogoFerragens[c.key]?.preco || 0); }); return cTot * (1 + ((BD.configCalculo?.margemLucroMaterial || 50) / 100)); }
document.getElementById('btn-orc').addEventListener('click', () => { updCab(); let cE = "-", cI = "-", h = "", t = 0; moveis.forEach(m => { const u = m.userData; if (u.tipo === 'parede' || !u.orig) return; if (cE === "-") cE = BD.coresMDF[u.corE]?.nome || u.corE; if (cI === "-") cI = BD.coresMDF[u.corI]?.nome || u.corI; const p = calcPreco(u); t += p; const dim = u.tipoCanto === 'canto' ? `CD:${u.ladoA} CE:${u.ladoB} PD:${u.profA} PE:${u.profB} A:${u.alt}` : `L:${u.larg} A:${u.alt} P:${u.prof}`; h += `<tr><td>${u.orig.nome} (${dim})</td><td style="text-align:right">R$ ${p.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`; }); if (t === 0) h = "<tr><td colspan='2'>Nenhum móvel.</td></tr>"; document.getElementById('orc-tbody').innerHTML = h; document.getElementById('out-cores').innerHTML = `Cor Externa: ${cE} | Cor Interna: ${cI}`; document.getElementById('orc-total').innerText = `R$ ${t.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; document.getElementById('modal-orc').style.display = 'flex'; });
function processarProd(tipo) { updCab(); let cliente = inpCli[0].value.trim() || 'Cliente', ambiente = inpAmb[0].value.trim() || 'Ambiente', nomeProj = `${cliente}_${ambiente}`.replace(/\s+/g, "_").toLowerCase(); let html = "", txtContent = "", csvContent = "\uFEFFMódulo;Peça;Qtd;Alt;Larg;Esp;Material;Bordas;CorBorda\n"; const tFerr = {}; moveis.forEach(m => { const u = m.userData; if (u.tipo === 'parede' || !u.orig || !u.orig.pecas) return; const v = getVars(u); const dim = u.tipoCanto === 'canto' ? `CD:${u.ladoA} CE:${u.ladoB} PD:${u.profA} PE:${u.profB} A:${u.alt}` : `A:${u.alt} L:${u.larg} P:${u.prof}`; if (tipo === 'html') html += `<div style="margin-bottom:40px"><h3 style="font-size:16px;margin-bottom:10px">${u.orig.nome} (${dim})</h3><table class="orc-tab"><thead><tr><th>Peça</th><th>Qtd</th><th>Alt</th><th>Larg</th><th>Esp</th><th>Material</th><th>Bordas</th><th>Cor Borda</th></tr></thead><tbody>`; u.orig.pecas.forEach(p => { const q = Math.round(rF(p.qtd || "1", v)); if (q <= 0) return; const alt = Math.round(rF(p.altura, v)), larg = Math.round(rF(p.largura, v)); let e = u.ei, cKey = u.corI, tBCor = u.corI; const tm = (p.tipoMaterial || "interna").toLowerCase(), tb = (p.tipoBorda || "interna").toLowerCase(); if (tm === 'externa') { e = u.ee; cKey = u.corE; } else if (tm === 'fundo') e = u.ef; if (tb === 'externa') tBCor = u.corE; if (p.espessura && !isNaN(+p.espessura)) e = +p.espessura; const nCor = BD.coresMDF[cKey]?.nome || cKey, nCorB = BD.coresMDF[tBCor]?.nome || tBCor; let bsArr = []; if (p.bordaA1) bsArr.push("A1"); if (p.bordaA2) bsArr.push("A2"); if (p.bordaL1) bsArr.push("L1"); if (p.bordaL2) bsArr.push("L2"); let bs = bsArr.join(" "); if (tipo === 'html') html += `<tr><td>${p.nome}</td><td>${q}</td><td>${alt}</td><td>${larg}</td><td>${e}</td><td>${nCor}</td><td>${bs}</td><td>${bs ? nCorB : ""}</td></tr>`; if (tipo === 'txt') { let cC = nCor.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''), cU = nCor.split(' ').join('_'); txtContent += `1.0000.${e}.${cC}.MDF;${p.nome};${alt};${larg};${q};${nomeProj};${p.bordaA1 ? "0.4" : "0"};${p.bordaA2 ? "0.4" : "0"};${p.bordaL1 ? "0.4" : "0"};${p.bordaL2 ? "0.4" : "0"};MDF-${e}-${cU};\n`; } if (tipo === 'csv') csvContent += `${u.orig.nome};${p.nome};${q};${alt};${larg};${e};${nCor};"${bs}";${bs ? nCorB : "Sem"}\n`; if (p.ferragensAssociadas) p.ferragensAssociadas.forEach(f => { const qF = rF(f.qtdFormula || "1", v) * q; if (qF > 0) tFerr[f.key] = (tFerr[f.key] || 0) + qF; }); }); if (tipo === 'html') html += `</tbody></table></div>`; if (u.orig.ferragens) u.orig.ferragens.forEach(f => { const qF = f.valor || rF(f.qtdFormula || "1", v); if (qF > 0) tFerr[f.key] = (tFerr[f.key] || 0) + qF; }); if (u.orig.corredicas) u.orig.corredicas.forEach(c => { const qF = rF(c.qtdFormula || "1", v); if (qF > 0) tFerr[c.key] = (tFerr[c.key] || 0) + qF; }); }); if (tipo === 'txt') { const a = document.createElement("a"), b = new Blob([txtContent], { type: 'text/plain;charset=utf-8' }); a.href = URL.createObjectURL(b); a.download = `cortcloud_${nomeProj}_${Date.now()}.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a); return; } if (tipo === 'csv') { csvContent += `\n\nFERRAGENS\nNome;Qtd;Unidade\n`; for (let k in tFerr) { const inf = BD.catalogoFerragens[k]; csvContent += `"${inf ? inf.nome : k}";${Math.ceil(tFerr[k])};"${inf ? inf.unidade : 'UN'}"\n`; } const a = document.createElement("a"), b = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); a.href = URL.createObjectURL(b); a.download = `planilha_${nomeProj}_${Date.now()}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); return; } if (tipo === 'html') { html += `<h3>Ferragens</h3><table class="orc-tab"><thead><tr><th>Ferragem</th><th>Qtd</th></tr></thead><tbody>`; let tem = false; for (let k in tFerr) { tem = true; const inf = BD.catalogoFerragens[k]; html += `<tr><td>${inf ? inf.nome : k}</td><td>${Math.ceil(tFerr[k])} ${inf ? inf.unidade : 'UN'}</td></tr>`; } if (!tem) html += `<tr><td colspan="2">Nenhuma</td></tr>`; html += `</tbody></table>`; document.getElementById('prod-corpo').innerHTML = html; document.getElementById('modal-prod').style.display = 'flex'; } }
document.getElementById('btn-prod').addEventListener('click', () => processarProd('html'));
document.getElementById('btn-txt').addEventListener('click', () => processarProd('txt'));
document.getElementById('btn-csv').addEventListener('click', () => processarProd('csv'));
window.imprimirEl = function(id) { document.querySelectorAll('.folha-print').forEach(el => { el.classList.remove('print-active'); el.style.display = 'none'; }); const el = document.getElementById(id); el.style.display = 'block'; el.classList.add('print-active'); window.print(); };

// === ANIMAÇÃO ===
function animar() { requestAnimationFrame(animar); ctrlCam.update(); moveis.forEach(m => { const u = m.userData, ab = u.aberto || false; m.children.forEach(f => { if (f.userData.isPorta) { const targetAngle = ab ? (-1.8 * f.userData.dirAb) : 0; f.rotation.y += (targetAngle - f.rotation.y) * .1; } if (f.userData.isGav) { const p = u.prof || 500, ee = u.ee || 15, zF = P / 2 - ee/2, zA = zF - p * .8; f.position.z += ((ab ? zA : zF) - f.position.z) * .15; } }); }); ren.render(cena, cam); }
animar();
window.addEventListener('resize', resize);