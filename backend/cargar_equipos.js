const admin = require('firebase-admin');
const xlsx = require('xlsx');

// ID CORREGIDO según Screenshot 2026-05-05 at 6.17.20 PM.png
const PROJECT_ID = 'polla-495421-ab029'; 

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: PROJECT_ID
});

const db = admin.firestore();

// Configuración para evitar errores por celdas vacías en el Excel
db.settings({
  ignoreUndefinedProperties: true
});

/**
 * Normaliza nombres para IDs
 */
function generarId(texto) {
    if (!texto) return 'id_desconocido';
    return texto.toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '_')
        .toLowerCase();
}

async function cargarTodo() {
    console.log(`🚀 Iniciando carga en el proyecto: ${PROJECT_ID}`);
    
    try {
        // Prueba de fuego
        console.log('Verificando acceso a Firestore...');
        await db.collection('_status_').doc('test').set({ 
            last_run: new Date().toISOString() 
        });
        console.log('✅ ¡CONECTADO CON ÉXITO!');

        const pathExcel = './equipos_grupos.xlsx';
        const workbook = xlsx.readFile(pathExcel);

        // --- 1. PAÍSES ---
        const sheetPaises = workbook.Sheets['paises'];
        if (sheetPaises) {
            const paisesRaw = xlsx.utils.sheet_to_json(sheetPaises);
            const batch = db.batch();
            paisesRaw.forEach(p => {
                if (p.Seleccion) {
                    const ref = db.collection('paises').doc(generarId(p.Seleccion));
                    batch.set(ref, {
                        nombre: p.Seleccion,
                        grupo: p.Grupo || 'N/A',
                        ranking_2022: p['Ranking FIFA 2022'] || 0,
                        sede: p.Sede || 'N/A',
                        participaciones: p.Participaciones || 0,
                        mejor_posicion: p['Mejor posicion historica'] || 'N/A'
                    });
                }
            });
            await batch.commit();
            console.log('✅ Países sincronizados.');
        }

        // --- 2. PARTIDOS ---
        const sheetPartidos = workbook.Sheets['fase_grupos'];
        if (sheetPartidos) {
            const partidosRaw = xlsx.utils.sheet_to_json(sheetPartidos);
            const batch = db.batch();
            partidosRaw.forEach((partido, index) => {
                if (partido.Local && partido.Visita) {
                    const ref = db.collection('partidos').doc(`partido_${index + 1}`);
                    
                    // Manejo de la columna 'hora' para evitar el error 'undefined' visto en Screenshot 2026-05-05 at 6.19.48 PM.jpg
                    const horaValor = partido['Hora (ET)'] || partido['Hora'] || null;

                    batch.set(ref, {
                        fecha: partido.Fecha || null,
                        hora: horaValor,
                        local: partido.Local,
                        visita: partido.Visita,
                        estadio: partido.Estadio || null,
                        fase: 'grupos'
                    });
                }
            });
            await batch.commit();
            console.log('✅ Calendario sincronizado.');
        }

        // --- 3. ESTADIOS ---
        const sheetEstadios = workbook.Sheets['info_estadio'];
        if (sheetEstadios) {
            const estadiosRaw = xlsx.utils.sheet_to_json(sheetEstadios);
            const batch = db.batch();
            estadiosRaw.forEach(e => {
                const nombreOficial = e['Nombre oficial'];
                if (nombreOficial) {
                    const ref = db.collection('estadios').doc(generarId(nombreOficial));
                    batch.set(ref, {
                        nombre: nombreOficial,
                        nombre_comercial: e['Nombre comercial'] || 'N/A',
                        ciudad: e.Ciudad || 'N/A',
                        capacidad: e['Aforo aprox'] || 0,
                        datos_relevantes: e['Datos relevantes'] || ''
                    });
                }
            });
            await batch.commit();
            console.log('✅ Estadios sincronizados.');
        }

        console.log('\n✨ PROCESO FINALIZADO EXITOSAMENTE.');

    } catch (err) {
        console.error('\n❌ ERROR:');
        console.error(`Mensaje: ${err.message}`);
        if (err.message.includes('NOT_FOUND')) {
            console.log('Revisa que el ID del proyecto en el JSON de tu llave coincida con el del código.');
        }
    }
}

cargarTodo();