/**
 * FIFA 2026 Rules Engine
 * Módulo centralizado con toda la lógica del reglamento FIFA 2026.
 * Sin dependencias externas — importable desde admin, index y simulador.
 */

// ── FIXTURE BASE (IDs canónicos) ─────────────────────────────────────────────
export const GRUPOS = 'ABCDEFGHIJKL'.split('');

export const FIXTURE_GRUPOS = {
  A:[
    {id:'fgA1',local:'Mexico',       visita:'Sudafrica',         fecha:'2026-06-11',hora:'15:00',estadio:'Estadio Azteca, Ciudad de México',          grupo:'A'},
    {id:'fgA2',local:'Corea del Sur',visita:'Chequia',           fecha:'2026-06-11',hora:'22:00',estadio:'Estadio Akron, Guadalajara',                 grupo:'A'},
    {id:'fgA3',local:'Chequia',      visita:'Sudafrica',         fecha:'2026-06-18',hora:'12:00',estadio:'Mercedes-Benz Stadium, Atlanta',             grupo:'A'},
    {id:'fgA4',local:'Mexico',       visita:'Corea del Sur',     fecha:'2026-06-18',hora:'21:00',estadio:'Estadio Azteca, Ciudad de México',           grupo:'A'},
    {id:'fgA5',local:'Sudafrica',    visita:'Corea del Sur',     fecha:'2026-06-24',hora:'21:00',estadio:'Estadio BBVA, Monterrey',                    grupo:'A'},
    {id:'fgA6',local:'Chequia',      visita:'Mexico',            fecha:'2026-06-24',hora:'21:00',estadio:'Estadio Azteca, Ciudad de México',           grupo:'A'},
  ],
  B:[
    {id:'fgB1',local:'Canada',              visita:'Bosnia y Herzegovina',fecha:'2026-06-12',hora:'15:00',estadio:'BMO Field, Toronto',              grupo:'B'},
    {id:'fgB2',local:'Qatar',               visita:'Suiza',               fecha:'2026-06-13',hora:'15:00',estadio:"Levi's Stadium, San Francisco",   grupo:'B'},
    {id:'fgB3',local:'Suiza',               visita:'Bosnia y Herzegovina',fecha:'2026-06-18',hora:'15:00',estadio:'SoFi Stadium, Los Ángeles',       grupo:'B'},
    {id:'fgB4',local:'Canada',              visita:'Qatar',               fecha:'2026-06-18',hora:'18:00',estadio:'BC Place, Vancouver',             grupo:'B'},
    {id:'fgB5',local:'Suiza',               visita:'Canada',              fecha:'2026-06-24',hora:'15:00',estadio:'BC Place, Vancouver',             grupo:'B'},
    {id:'fgB6',local:'Bosnia y Herzegovina',visita:'Qatar',               fecha:'2026-06-24',hora:'15:00',estadio:'Lumen Field, Seattle',            grupo:'B'},
  ],
  C:[
    {id:'fgC1',local:'Brasil', visita:'Marruecos',fecha:'2026-06-13',hora:'18:00',estadio:'Gillette Stadium, Boston',     grupo:'C'},
    {id:'fgC2',local:'Haiti',  visita:'Escocia',  fecha:'2026-06-13',hora:'21:00',estadio:'MetLife Stadium, Nueva York',  grupo:'C'},
    {id:'fgC3',local:'Escocia',visita:'Marruecos',fecha:'2026-06-19',hora:'18:00',estadio:'Gillette Stadium, Boston',     grupo:'C'},
    {id:'fgC4',local:'Brasil', visita:'Haiti',    fecha:'2026-06-19',hora:'20:30',estadio:'Hard Rock Stadium, Miami',     grupo:'C'},
    {id:'fgC5',local:'Marruecos',visita:'Haiti',  fecha:'2026-06-24',hora:'18:00',estadio:'Mercedes-Benz Stadium, Atlanta',grupo:'C'},
    {id:'fgC6',local:'Escocia',visita:'Brasil',   fecha:'2026-06-24',hora:'18:00',estadio:'Hard Rock Stadium, Miami',     grupo:'C'},
  ],
  D:[
    {id:'fgD1',local:'Estados Unidos',visita:'Paraguay',       fecha:'2026-06-12',hora:'21:00',estadio:'SoFi Stadium, Los Ángeles',    grupo:'D'},
    {id:'fgD2',local:'Australia',     visita:'Turquia',        fecha:'2026-06-14',hora:'00:00',estadio:'BC Place, Vancouver',           grupo:'D'},
    {id:'fgD3',local:'Estados Unidos',visita:'Australia',      fecha:'2026-06-19',hora:'15:00',estadio:"Levi's Stadium, San Francisco", grupo:'D'},
    {id:'fgD4',local:'Turquia',       visita:'Paraguay',       fecha:'2026-06-19',hora:'23:00',estadio:'BMO Field, Toronto',            grupo:'D'},
    {id:'fgD5',local:'Turquia',       visita:'Estados Unidos', fecha:'2026-06-25',hora:'22:00',estadio:'SoFi Stadium, Los Ángeles',    grupo:'D'},
    {id:'fgD6',local:'Paraguay',      visita:'Australia',      fecha:'2026-06-25',hora:'22:00',estadio:"Levi's Stadium, San Francisco", grupo:'D'},
  ],
  E:[
    {id:'fgE1',local:'Alemania',       visita:'Curazao',        fecha:'2026-06-14',hora:'13:00',estadio:'Lincoln Financial Field, Filadelfia',grupo:'E'},
    {id:'fgE2',local:'Costa de Marfil',visita:'Ecuador',        fecha:'2026-06-14',hora:'19:00',estadio:'NRG Stadium, Houston',               grupo:'E'},
    {id:'fgE3',local:'Alemania',       visita:'Costa de Marfil',fecha:'2026-06-20',hora:'16:00',estadio:'MetLife Stadium, Nueva York',        grupo:'E'},
    {id:'fgE4',local:'Ecuador',        visita:'Curazao',        fecha:'2026-06-20',hora:'20:00',estadio:'Arrowhead Stadium, Kansas City',      grupo:'E'},
    {id:'fgE5',local:'Curazao',        visita:'Costa de Marfil',fecha:'2026-06-25',hora:'16:00',estadio:'Lincoln Financial Field, Filadelfia',grupo:'E'},
    {id:'fgE6',local:'Ecuador',        visita:'Alemania',       fecha:'2026-06-25',hora:'16:00',estadio:'MetLife Stadium, Nueva York',        grupo:'E'},
  ],
  F:[
    {id:'fgF1',local:'Paises Bajos',visita:'Japon', fecha:'2026-06-14',hora:'16:00',estadio:'AT&T Stadium, Dallas',         grupo:'F'},
    {id:'fgF2',local:'Suecia',      visita:'Tunez', fecha:'2026-06-14',hora:'22:00',estadio:'Estadio BBVA, Monterrey',       grupo:'F'},
    {id:'fgF3',local:'Paises Bajos',visita:'Suecia',fecha:'2026-06-20',hora:'13:00',estadio:'NRG Stadium, Houston',          grupo:'F'},
    {id:'fgF4',local:'Tunez',       visita:'Japon', fecha:'2026-06-21',hora:'00:00',estadio:'Estadio BBVA, Monterrey',       grupo:'F'},
    {id:'fgF5',local:'Tunez',       visita:'Paises Bajos',fecha:'2026-06-25',hora:'19:00',estadio:'Arrowhead Stadium, Kansas City',grupo:'F'},
    {id:'fgF6',local:'Japon',       visita:'Suecia',fecha:'2026-06-25',hora:'19:00',estadio:'AT&T Stadium, Dallas',          grupo:'F'},
  ],
  G:[
    {id:'fgG1',local:'Belgica',      visita:'Egipto',      fecha:'2026-06-15',hora:'15:00',estadio:'Lumen Field, Seattle',      grupo:'G'},
    {id:'fgG2',local:'Iran',         visita:'Nueva Zelanda',fecha:'2026-06-15',hora:'21:00',estadio:'SoFi Stadium, Los Ángeles',grupo:'G'},
    {id:'fgG3',local:'Belgica',      visita:'Iran',        fecha:'2026-06-21',hora:'15:00',estadio:'SoFi Stadium, Los Ángeles', grupo:'G'},
    {id:'fgG4',local:'Nueva Zelanda',visita:'Egipto',      fecha:'2026-06-21',hora:'21:00',estadio:'BC Place, Vancouver',       grupo:'G'},
    {id:'fgG5',local:'Nueva Zelanda',visita:'Belgica',     fecha:'2026-06-26',hora:'23:00',estadio:'BC Place, Vancouver',       grupo:'G'},
    {id:'fgG6',local:'Egipto',       visita:'Iran',        fecha:'2026-06-26',hora:'23:00',estadio:'Hard Rock Stadium, Miami',  grupo:'G'},
  ],
  H:[
    {id:'fgH1',local:'Espana',        visita:'Cabo Verde',   fecha:'2026-06-15',hora:'12:00',estadio:'Mercedes-Benz Stadium, Atlanta',grupo:'H'},
    {id:'fgH2',local:'Arabia Saudita',visita:'Uruguay',      fecha:'2026-06-15',hora:'18:00',estadio:'Hard Rock Stadium, Miami',      grupo:'H'},
    {id:'fgH3',local:'Espana',        visita:'Arabia Saudita',fecha:'2026-06-21',hora:'12:00',estadio:'Mercedes-Benz Stadium, Atlanta',grupo:'H'},
    {id:'fgH4',local:'Uruguay',       visita:'Cabo Verde',   fecha:'2026-06-21',hora:'18:00',estadio:'Hard Rock Stadium, Miami',      grupo:'H'},
    {id:'fgH5',local:'Cabo Verde',    visita:'Arabia Saudita',fecha:'2026-06-26',hora:'20:00',estadio:'NRG Stadium, Houston',         grupo:'H'},
    {id:'fgH6',local:'Uruguay',       visita:'Espana',       fecha:'2026-06-26',hora:'20:00',estadio:'Estadio Akron, Guadalajara',    grupo:'H'},
  ],
  I:[
    {id:'fgI1',local:'Francia',visita:'Senegal',fecha:'2026-06-16',hora:'15:00',estadio:'MetLife Stadium, Nueva York',          grupo:'I'},
    {id:'fgI2',local:'Irak',   visita:'Noruega',fecha:'2026-06-16',hora:'18:00',estadio:'Gillette Stadium, Boston',             grupo:'I'},
    {id:'fgI3',local:'Francia',visita:'Irak',   fecha:'2026-06-22',hora:'17:00',estadio:'Lincoln Financial Field, Filadelfia', grupo:'I'},
    {id:'fgI4',local:'Noruega',visita:'Senegal',fecha:'2026-06-22',hora:'20:00',estadio:'MetLife Stadium, Nueva York',          grupo:'I'},
    {id:'fgI5',local:'Noruega',visita:'Francia',fecha:'2026-06-26',hora:'15:00',estadio:'Gillette Stadium, Boston',             grupo:'I'},
    {id:'fgI6',local:'Senegal',visita:'Irak',   fecha:'2026-06-26',hora:'15:00',estadio:'BMO Field, Toronto',                  grupo:'I'},
  ],
  J:[
    {id:'fgJ1',local:'Argentina',visita:'Argelia', fecha:'2026-06-16',hora:'21:00',estadio:'Arrowhead Stadium, Kansas City',   grupo:'J'},
    {id:'fgJ2',local:'Austria',  visita:'Jordania',fecha:'2026-06-17',hora:'00:00',estadio:"Levi's Stadium, San Francisco",    grupo:'J'},
    {id:'fgJ3',local:'Argentina',visita:'Austria', fecha:'2026-06-22',hora:'13:00',estadio:'AT&T Stadium, Dallas',             grupo:'J'},
    {id:'fgJ4',local:'Jordania', visita:'Argelia', fecha:'2026-06-22',hora:'23:00',estadio:"Levi's Stadium, San Francisco",    grupo:'J'},
    {id:'fgJ5',local:'Argelia',  visita:'Austria', fecha:'2026-06-27',hora:'22:00',estadio:'Arrowhead Stadium, Kansas City',   grupo:'J'},
    {id:'fgJ6',local:'Jordania', visita:'Argentina',fecha:'2026-06-27',hora:'22:00',estadio:'AT&T Stadium, Dallas',            grupo:'J'},
  ],
  K:[
    {id:'fgK1',local:'Portugal',   visita:'RD Congo',  fecha:'2026-06-17',hora:'13:00',estadio:'NRG Stadium, Houston',              grupo:'K'},
    {id:'fgK2',local:'Uzbekistan', visita:'Colombia',  fecha:'2026-06-17',hora:'22:00',estadio:'Estadio Azteca, Ciudad de México',  grupo:'K'},
    {id:'fgK3',local:'Portugal',   visita:'Uzbekistan',fecha:'2026-06-23',hora:'13:00',estadio:'NRG Stadium, Houston',              grupo:'K'},
    {id:'fgK4',local:'Colombia',   visita:'RD Congo',  fecha:'2026-06-23',hora:'22:00',estadio:'Estadio Akron, Guadalajara',        grupo:'K'},
    {id:'fgK5',local:'Colombia',   visita:'Portugal',  fecha:'2026-06-27',hora:'19:30',estadio:'Hard Rock Stadium, Miami',          grupo:'K'},
    {id:'fgK6',local:'RD Congo',   visita:'Uzbekistan',fecha:'2026-06-27',hora:'19:30',estadio:'Mercedes-Benz Stadium, Atlanta',    grupo:'K'},
  ],
  L:[
    {id:'fgL1',local:'Inglaterra',visita:'Croacia',  fecha:'2026-06-17',hora:'16:00',estadio:'AT&T Stadium, Dallas',           grupo:'L'},
    {id:'fgL2',local:'Ghana',     visita:'Panama',   fecha:'2026-06-17',hora:'19:00',estadio:'BMO Field, Toronto',             grupo:'L'},
    {id:'fgL3',local:'Inglaterra',visita:'Ghana',    fecha:'2026-06-23',hora:'16:00',estadio:'Gillette Stadium, Boston',       grupo:'L'},
    {id:'fgL4',local:'Panama',    visita:'Croacia',  fecha:'2026-06-23',hora:'19:00',estadio:'BMO Field, Toronto',             grupo:'L'},
    {id:'fgL5',local:'Panama',    visita:'Inglaterra',fecha:'2026-06-27',hora:'17:00',estadio:'MetLife Stadium, Nueva York',   grupo:'L'},
    {id:'fgL6',local:'Croacia',   visita:'Ghana',    fecha:'2026-06-27',hora:'17:00',estadio:'Lincoln Financial Field, Filadelfia',grupo:'L'},
  ],
};

// Mapa plano id → partido
export const FIXTURE_MAP = {};
Object.values(FIXTURE_GRUPOS).forEach(arr => arr.forEach(p => { FIXTURE_MAP[p.id] = p; }));

// ── FIXTURE ELIMINATORIAS (IDs canónicos) ────────────────────────────────────
// Numeración FIFA: M73–M104
export const FIXTURE_ELIM = [
  // 32avos (M73–M88)
  {id:'r32_1', num:'M73',fase:'32avos',local:'2.A',     visita:'2.B',     fecha:'2026-06-28',hora:'16:00',estadio:'SoFi Stadium, Los Ángeles'},
  {id:'r32_2', num:'M74',fase:'32avos',local:'1.A',     visita:'3er T1',  fecha:'2026-06-29',hora:'20:00',estadio:'Gillette Stadium, Boston'},
  {id:'r32_3', num:'M75',fase:'32avos',local:'1.F',     visita:'2.C',     fecha:'2026-06-29',hora:'16:00',estadio:'Estadio BBVA, Monterrey'},
  {id:'r32_4', num:'M76',fase:'32avos',local:'1.C',     visita:'2.F',     fecha:'2026-06-29',hora:'20:00',estadio:'NRG Stadium, Houston'},
  {id:'r32_5', num:'M77',fase:'32avos',local:'1.B',     visita:'3er T2',  fecha:'2026-06-30',hora:'16:00',estadio:'MetLife Stadium, Nueva York'},
  {id:'r32_6', num:'M78',fase:'32avos',local:'2.E',     visita:'2.I',     fecha:'2026-06-30',hora:'20:00',estadio:'AT&T Stadium, Dallas'},
  {id:'r32_7', num:'M79',fase:'32avos',local:'1.D',     visita:'3er T3',  fecha:'2026-07-01',hora:'16:00',estadio:"Levi's Stadium, San Francisco"},
  {id:'r32_8', num:'M80',fase:'32avos',local:'1.E',     visita:'3er T4',  fecha:'2026-07-01',hora:'20:00',estadio:'Mercedes-Benz Stadium, Atlanta'},
  {id:'r32_9', num:'M81',fase:'32avos',local:'1.G',     visita:'3er T5',  fecha:'2026-07-02',hora:'16:00',estadio:'SoFi Stadium, Los Ángeles'},
  {id:'r32_10',num:'M82',fase:'32avos',local:'2.C',     visita:'2.D',     fecha:'2026-07-02',hora:'20:00',estadio:'BC Place, Vancouver'},
  {id:'r32_11',num:'M83',fase:'32avos',local:'2.K',     visita:'2.L',     fecha:'2026-07-03',hora:'16:00',estadio:'Hard Rock Stadium, Miami'},
  {id:'r32_12',num:'M84',fase:'32avos',local:'1.H',     visita:'2.J',     fecha:'2026-06-30',hora:'20:00',estadio:'Estadio Azteca, Ciudad de México'},
  {id:'r32_13',num:'M85',fase:'32avos',local:'1.I',     visita:'3er T6',  fecha:'2026-07-02',hora:'16:00',estadio:'BMO Field, Toronto'},
  {id:'r32_14',num:'M86',fase:'32avos',local:'1.J',     visita:'2.H',     fecha:'2026-07-03',hora:'20:00',estadio:'AT&T Stadium, Dallas'},
  {id:'r32_15',num:'M87',fase:'32avos',local:'1.L',     visita:'3er T7',  fecha:'2026-07-03',hora:'16:00',estadio:'Arrowhead Stadium, Kansas City'},
  {id:'r32_16',num:'M88',fase:'32avos',local:'2.D',     visita:'2.G',     fecha:'2026-07-01',hora:'20:00',estadio:'Lumen Field, Seattle'},
  // Octavos (M89–M96)
  {id:'r16_1', num:'M89',fase:'octavos',local:'G.M73',visita:'G.M74',fecha:'2026-07-04',hora:'16:00',estadio:'Lincoln Financial Field, Filadelfia'},
  {id:'r16_2', num:'M90',fase:'octavos',local:'G.M75',visita:'G.M76',fecha:'2026-07-04',hora:'20:00',estadio:'NRG Stadium, Houston'},
  {id:'r16_3', num:'M91',fase:'octavos',local:'G.M77',visita:'G.M78',fecha:'2026-07-05',hora:'16:00',estadio:'MetLife Stadium, Nueva York'},
  {id:'r16_4', num:'M92',fase:'octavos',local:'G.M79',visita:'G.M80',fecha:'2026-07-05',hora:'20:00',estadio:'Estadio Azteca, Ciudad de México'},
  {id:'r16_5', num:'M93',fase:'octavos',local:'G.M81',visita:'G.M82',fecha:'2026-07-06',hora:'16:00',estadio:'AT&T Stadium, Dallas'},
  {id:'r16_6', num:'M94',fase:'octavos',local:'G.M83',visita:'G.M84',fecha:'2026-07-06',hora:'20:00',estadio:'Lumen Field, Seattle'},
  {id:'r16_7', num:'M95',fase:'octavos',local:'G.M85',visita:'G.M86',fecha:'2026-07-07',hora:'16:00',estadio:'Mercedes-Benz Stadium, Atlanta'},
  {id:'r16_8', num:'M96',fase:'octavos',local:'G.M87',visita:'G.M88',fecha:'2026-07-07',hora:'20:00',estadio:'BC Place, Vancouver'},
  // Cuartos (M97–M100)
  {id:'qf1',num:'M97',fase:'cuartos',local:'G.M89',visita:'G.M90',fecha:'2026-07-09',hora:'16:00',estadio:'Gillette Stadium, Boston'},
  {id:'qf2',num:'M98',fase:'cuartos',local:'G.M91',visita:'G.M92',fecha:'2026-07-11',hora:'17:00',estadio:'Hard Rock Stadium, Miami'},
  {id:'qf3',num:'M99',fase:'cuartos',local:'G.M93',visita:'G.M94',fecha:'2026-07-10',hora:'12:00',estadio:'SoFi Stadium, Los Ángeles'},
  {id:'qf4',num:'M100',fase:'cuartos',local:'G.M95',visita:'G.M96',fecha:'2026-07-11',hora:'20:00',estadio:'Arrowhead Stadium, Kansas City'},
  // Semis (M101–M102)
  {id:'sf1',num:'M101',fase:'semis',local:'G.M97',visita:'G.M98',fecha:'2026-07-14',hora:'14:00',estadio:'AT&T Stadium, Dallas'},
  {id:'sf2',num:'M102',fase:'semis',local:'G.M99',visita:'G.M100',fecha:'2026-07-15',hora:'15:00',estadio:'Mercedes-Benz Stadium, Atlanta'},
  // Tercer lugar (M103)
  {id:'3p', num:'M103',fase:'tercero',local:'Perd.M101',visita:'Perd.M102',fecha:'2026-07-18',hora:'17:00',estadio:'Hard Rock Stadium, Miami'},
  // Final (M104)
  {id:'fin',num:'M104',fase:'final',local:'G.M101',visita:'G.M102',fecha:'2026-07-19',hora:'15:00',estadio:'MetLife Stadium, Nueva York'},
];

// ── MOTOR FIFA — TABLA DE POSICIONES ────────────────────────────────────────
/**
 * Calcula la tabla de posiciones completa de un grupo.
 * @param {string} grupo - Letra del grupo (A-L)
 * @param {Object} resCache - { [id]: { resultado_local, resultado_visita, tarjetas_local?, tarjetas_visita? } }
 * @returns {Array} Tabla ordenada por criterios FIFA, cada elemento:
 *   { nombre, pj, g, e, pe, gf, gc, pts, dg, fp, forma[] }
 */
export function calcularTablaGrupo(grupo, resCache = {}) {
  const partidos = FIXTURE_GRUPOS[grupo] || [];
  const equipos = [...new Set(partidos.flatMap(p => [p.local, p.visita]))];

  // Inicializar stats
  const stats = {};
  equipos.forEach(eq => {
    stats[eq] = { nombre: eq, pj:0, g:0, e:0, pe:0, gf:0, gc:0, pts:0, dg:0, fp:0, forma:[], partidos:[] };
  });

  // Acumular resultados
  partidos.forEach(p => {
    const r = resCache[p.id];
    if (!r || r.resultado_local == null || r.resultado_visita == null) return;
    const gl = Number(r.resultado_local);
    const gv = Number(r.resultado_visita);
    if (isNaN(gl) || isNaN(gv)) return;

    stats[p.local].pj++;  stats[p.visita].pj++;
    stats[p.local].gf  += gl; stats[p.local].gc  += gv;
    stats[p.visita].gf += gv; stats[p.visita].gc += gl;
    stats[p.local].partidos.push({ rival: p.visita, gf: gl, gc: gv });
    stats[p.visita].partidos.push({ rival: p.local,  gf: gv, gc: gl });

    if (gl > gv) {
      stats[p.local].g++;  stats[p.local].pts  += 3; stats[p.visita].pe++;
      stats[p.local].forma.push('G'); stats[p.visita].forma.push('P');
    } else if (gv > gl) {
      stats[p.visita].g++; stats[p.visita].pts += 3; stats[p.local].pe++;
      stats[p.visita].forma.push('G'); stats[p.local].forma.push('P');
    } else {
      stats[p.local].e++;  stats[p.local].pts  += 1;
      stats[p.visita].e++; stats[p.visita].pts += 1;
      stats[p.local].forma.push('E'); stats[p.visita].forma.push('E');
    }

    // Fair Play
    const fpL = r.tarjetas_local  || { amarillas:0, rojas2:0, rojas_directas:0 };
    const fpV = r.tarjetas_visita || { amarillas:0, rojas2:0, rojas_directas:0 };
    stats[p.local].fp  -= (fpL.amarillas||0)*1 + (fpL.rojas2||0)*3 + (fpL.rojas_directas||0)*4;
    stats[p.visita].fp -= (fpV.amarillas||0)*1 + (fpV.rojas2||0)*3 + (fpV.rojas_directas||0)*4;
  });

  Object.values(stats).forEach(s => { s.dg = s.gf - s.gc; });

  // Ordenar con criterios FIFA completos
  const tabla = Object.values(stats);
  return ordenarFIFA(tabla, stats, resCache, grupo);
}

/**
 * Ordenamiento FIFA (criterios 1-5 + desempate directo entre empatados).
 */
function ordenarFIFA(tabla, allStats, resCache, grupo) {
  return tabla.sort((a, b) => {
    // 1. Puntos
    if (b.pts !== a.pts) return b.pts - a.pts;
    // 2. Diferencia de goles general
    if (b.dg !== a.dg) return b.dg - a.dg;
    // 3. Goles a favor generales
    if (b.gf !== a.gf) return b.gf - a.gf;
    // 4. Resultado directo (solo si son exactamente 2 equipos empatados)
    const directoA = getDirecto(a.nombre, b.nombre, allStats, resCache, grupo);
    const directoB = getDirecto(b.nombre, a.nombre, allStats, resCache, grupo);
    if (directoA !== null && directoB !== null) {
      if (directoA.pts !== directoB.pts) return directoB.pts - directoA.pts;
      const dgA = directoA.gf - directoA.gc;
      const dgB = directoB.gf - directoB.gc;
      if (dgA !== dgB) return dgB - dgA;
      if (directoA.gf !== directoB.gf) return directoB.gf - directoA.gf;
    }
    // 5. Fair Play
    if (b.fp !== a.fp) return b.fp - a.fp;
    // Alfabético como último recurso
    return a.nombre.localeCompare(b.nombre);
  });
}

function getDirecto(eq1, eq2, allStats, resCache, grupo) {
  const partidos = FIXTURE_GRUPOS[grupo] || [];
  let pts=0, gf=0, gc=0;
  partidos.forEach(p => {
    const r = resCache[p.id];
    if (!r || r.resultado_local == null) return;
    const gl = Number(r.resultado_local), gv = Number(r.resultado_visita);
    if (p.local === eq1 && p.visita === eq2) {
      gf+=gl; gc+=gv; pts += gl>gv?3:gl===gv?1:0;
    } else if (p.local === eq2 && p.visita === eq1) {
      gf+=gv; gc+=gl; pts += gv>gl?3:gv===gl?1:0;
    }
  });
  return { pts, gf, gc };
}

// ── MEJORES TERCEROS (FIFA Anexo) ────────────────────────────────────────────
/**
 * Selecciona los 8 mejores terceros de los 12 grupos.
 * @param {Object} resCache
 * @returns {Array} 8 terceros ordenados, cada uno con { nombre, grupo, pts, dg, gf, fp }
 */
export function getMejoresTerceros(resCache = {}) {
  const terceros = GRUPOS.map(g => {
    const tabla = calcularTablaGrupo(g, resCache);
    if (tabla.length < 3) return null;
    return { ...tabla[2], grupo: g };
  }).filter(Boolean);

  return terceros
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg  !== a.dg)  return b.dg  - a.dg;
      if (b.gf  !== a.gf)  return b.gf  - a.gf;
      if (b.fp  !== a.fp)  return b.fp  - a.fp;
      return a.nombre.localeCompare(b.nombre);
    })
    .slice(0, 8);
}

// ── GENERADOR DE BRACKET FIFA 2026 ───────────────────────────────────────────
/**
 * Genera el cuadro completo de 32avos con equipos reales.
 * Implementa la lógica oficial FIFA de asignación de 3eros
 * (Anexo C: un 3ero no puede enfrentar a un equipo de su mismo grupo).
 *
 * @param {Object} resCache - Resultados de fase de grupos
 * @returns {Array} FIXTURE_ELIM con local/visita resueltos
 */
export function generarBracket(resCache = {}) {
  // Calcular clasificados
  const clasificados = {};
  GRUPOS.forEach(g => {
    const tabla = calcularTablaGrupo(g, resCache);
    clasificados[g] = {
      primero: tabla[0]?.nombre || `1.${g}`,
      segundo: tabla[1]?.nombre || `2.${g}`,
      tercero: tabla[2]?.nombre || `3.${g}`,
    };
  });

  const p1 = g => clasificados[g]?.primero || `1.${g}`;
  const p2 = g => clasificados[g]?.segundo || `2.${g}`;

  // Obtener mejores 8 terceros
  const mejoresTerceros = getMejoresTerceros(resCache);

  // Asignación oficial de 3eros según FIFA Anexo C
  // Los cruces dinámicos (M74,M77,M79,M80,M81,M85,M87) reciben los 3eros
  // Restricción: el 3ero T_n no puede ser del mismo grupo que el 1ero que enfrenta
  // Slots: M74(1.A), M77(1.B), M79(1.D), M80(1.E), M81(1.G), M85(1.I), M87(1.L)
  // Pero también M82(2.C vs 2.D) — corregido en el fixture fijo

  // Grupos de los 1eros en los slots dinámicos
  const slotsPrimeros = ['A','B','D','E','G','I','L']; // grupos de los 1eros que juegan vs 3eros
  const tercerosAsignados = asignarTercerosFIFA(mejoresTerceros, slotsPrimeros);

  // Resolver fixture
  const bracket = FIXTURE_ELIM.map(p => {
    let local  = resolverEquipo(p.local,  clasificados, tercerosAsignados, mejoresTerceros);
    let visita = resolverEquipo(p.visita, clasificados, tercerosAsignados, mejoresTerceros);
    return { ...p, local, visita };
  });

  return bracket;
}

/**
 * Asigna los 8 mejores terceros a los 7 slots dinámicos
 * evitando cruces del mismo grupo (FIFA Anexo C).
 * Usa backtracking si hay conflicto.
 */
function asignarTercerosFIFA(terceros, slotsPrimeros) {
  const asignados = {};
  const usados = new Set();

  function backtrack(i) {
    if (i === slotsPrimeros.length) return true;
    const grupoSlot = slotsPrimeros[i];
    for (let j = 0; j < terceros.length; j++) {
      const t = terceros[j];
      if (usados.has(t.nombre)) continue;
      // No puede ser del mismo grupo que el 1ero del slot
      if (t.grupo === grupoSlot) continue;
      asignados[`T${i+1}`] = t.nombre;
      usados.add(t.nombre);
      if (backtrack(i + 1)) return true;
      delete asignados[`T${i+1}`];
      usados.delete(t.nombre);
    }
    return false;
  }

  backtrack(0);
  return asignados;
}

function resolverEquipo(placeholder, clasificados, tercerosAsignados, mejoresTerceros) {
  if (!placeholder) return 'Por confirmar';

  // Formato "1.X" → primero del grupo X
  const m1 = placeholder.match(/^1\.([A-L])$/);
  if (m1) return clasificados[m1[1]]?.primero || `1.${m1[1]}`;

  // Formato "2.X" → segundo del grupo X
  const m2 = placeholder.match(/^2\.([A-L])$/);
  if (m2) return clasificados[m2[1]]?.segundo || `2.${m2[1]}`;

  // Formato "3er T1..T7" → mejor tercero asignado
  const mT = placeholder.match(/3er T(\d+)/);
  if (mT) return tercerosAsignados[`T${mT[1]}`] || `3er T${mT[1]}`;

  // Ya tiene nombre real
  return placeholder;
}

// ── CÁLCULO PUNTAJE POLLA ────────────────────────────────────────────────────
/**
 * Calcula puntos de la polla para una apuesta vs resultado real.
 * 4 pts exacto (con ganador) | 3 pts ganador correcto | 2 pts empate exacto | 1 pt empate incorrecto | 0 sin acierto
 */
export function calcularPuntajePolla(real, apuesta) {
  const rl = Number(real.local),    rv = Number(real.visita);
  const al = Number(apuesta.local), av = Number(apuesta.visita);
  if ([rl,rv,al,av].some(v => isNaN(v))) return null;

  if (al === rl && av === rv && rl !== rv) return 4;
  if (al === rl && av === rv && rl === rv) return 2;

  const gr = rl > rv ? 'L' : rl < rv ? 'V' : 'E';
  const ga = al > av ? 'L' : al < av ? 'V' : 'E';

  if (gr === ga && gr !== 'E') return 3;
  if (gr === 'E' && ga === 'E') return 1;
  return 0;
}

// ── UTILIDADES ────────────────────────────────────────────────────────────────
export function normNombre(t) {
  return (t || '').toString().trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`´]/g, '');
}

// Exportar fixture plano para importación a Firestore
export const PARTIDOS_GRUPOS_FLAT = Object.values(FIXTURE_GRUPOS).flat();
export const PARTIDOS_ELIM_FLAT   = FIXTURE_ELIM;
