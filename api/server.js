const express = require('express');
const admin   = require('firebase-admin');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// ── Constantes ───────────────────────────────────────────────────────────────
const PROJECT_ID   = 'polla-495421-ab029';
const ADMIN_UID    = 'ILpJZ22JLnQWhrLZgPzIvUn6MJt1'; // faldunate@gmail.com
const FECHA_CIERRE = new Date('2026-06-10T23:59:59-05:00');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId:  PROJECT_ID
});

const db = admin.firestore();

// ── Middleware: verificar token Firebase ─────────────────────────────────────
async function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(auth.split('Bearer ')[1]);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ── Middleware: solo admin ───────────────────────────────────────────────────
// Usa UID (no email). El UID es inmutable en Firebase;
// el email puede cambiar o ser falseado con custom tokens.
function onlyAdmin(req, res, next) {
  if (req.user.uid !== ADMIN_UID) {
    return res.status(403).json({ error: 'Acceso denegado: solo el administrador puede realizar esta acción' });
  }
  next();
}

// ── Scoring ──────────────────────────────────────────────────────────────────
// 4 pts → resultado exacto con ganador
// 3 pts → ganador correcto (marcador incorrecto)
// 2 pts → empate exacto
// 1 pt  → empate predicho pero marcador incorrecto
// 0 pts → sin acierto
function calcularPuntaje(real, apuesta) {
  const rl = Number(real.local),    rv = Number(real.visita);
  const al = Number(apuesta.local), av = Number(apuesta.visita);

  const exacto     = al === rl && av === rv;
  const empateReal = rl === rv;

  if (exacto && !empateReal) return 4;
  if (exacto &&  empateReal) return 2;

  const gr = rl > rv ? 'L' : rl < rv ? 'V' : 'E';
  const ga = al > av ? 'L' : al < av ? 'V' : 'E';

  if (gr === ga && gr !== 'E') return 3;
  if (gr === 'E' && ga === 'E') return 1;
  return 0;
}

// ── DATA GENERAL (pública) ───────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  try {
    const [paisesSnap, partidosSnap, estadiosSnap] = await Promise.all([
      db.collection('paises').get(),
      db.collection('partidos').get(),
      db.collection('estadios').get()
    ]);
    res.json({
      paises:   paisesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      partidos: partidosSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      estadios: estadiosSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GRUPOS ───────────────────────────────────────────────────────────────────

// Listar grupos (público)
app.get('/api/grupos', async (req, res) => {
  try {
    const snap = await db.collection('grupos').orderBy('creadoEn').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) {
    // fallback sin ordenar si no existe el índice
    try {
      const snap2 = await db.collection('grupos').get();
      res.json(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e2) {
      res.status(500).json({ error: e2.message });
    }
  }
});

// Crear grupo (solo admin)
app.post('/api/grupos', verifyToken, onlyAdmin, async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'Falta el nombre del grupo' });
  try {
    const ref = await db.collection('grupos').add({
      nombre:      nombre.trim(),
      descripcion: descripcion?.trim() || '',
      creadoEn:    admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: ref.id, nombre, descripcion });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Eliminar grupo (solo admin)
app.delete('/api/grupos/:id', verifyToken, onlyAdmin, async (req, res) => {
  try {
    await db.collection('grupos').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PARTICIPANTES ────────────────────────────────────────────────────────────

// Obtener mi perfil
app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('participantes').doc(req.user.uid).get();
    res.json(doc.exists ? { id: doc.id, ...doc.data() } : null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Unirse a un grupo
app.post('/api/grupos/:grupoId/unirse', verifyToken, async (req, res) => {
  // El admin no participa en la polla
  if (req.user.uid === ADMIN_UID) {
    return res.status(403).json({ error: 'El administrador no puede unirse a grupos de jugadores' });
  }

  if (new Date() > FECHA_CIERRE) {
    return res.status(403).json({ error: 'Las inscripciones están cerradas' });
  }

  const { grupoId } = req.params;
  const uid    = req.user.uid;
  const email  = req.user.email;
  const nombre = req.user.name || req.user.email;

  try {
    const grupoDoc = await db.collection('grupos').doc(grupoId).get();
    if (!grupoDoc.exists) return res.status(404).json({ error: 'Grupo no encontrado' });

    const yaDoc = await db.collection('participantes').doc(uid).get();
    if (yaDoc.exists) {
      const actual = yaDoc.data();
      if (actual.grupoId === grupoId) return res.json({ ok: true, mensaje: 'Ya estás en este grupo' });
      return res.status(400).json({ error: `Ya estás inscrito en "${actual.grupoNombre}"` });
    }

    await db.collection('participantes').doc(uid).set({
      uid, email, nombre,
      grupoId,
      grupoNombre: grupoDoc.data().nombre,
      estado:  'aprobado',
      unidoEn: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SOLICITUDES (admin) ──────────────────────────────────────────────────────

// Listar todos los participantes
app.get('/api/solicitudes', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const snap = await db.collection('participantes').get();
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const orden = { pendiente: 0, aprobado: 1, rechazado: 2 };
    lista.sort((a, b) =>
      (orden[a.estado || 'pendiente'] ?? 0) - (orden[b.estado || 'pendiente'] ?? 0)
    );
    res.json(lista);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cambiar estado de un participante
app.patch('/api/solicitudes/:uid', verifyToken, onlyAdmin, async (req, res) => {
  const { uid }    = req.params;
  const { estado } = req.body;
  if (!['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    await db.collection('participantes').doc(uid).update({
      estado,
      estadoActualizadoEn: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ ok: true, uid, estado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── APUESTAS ─────────────────────────────────────────────────────────────────

// Guardar / actualizar apuesta
app.post('/api/apuestas', verifyToken, async (req, res) => {
  // El admin no apuesta
  if (req.user.uid === ADMIN_UID) {
    return res.status(403).json({ error: 'El administrador no puede realizar apuestas' });
  }

  // Bloqueo: día 10 de junio completo + después del cierre
  const ahora = new Date();
  const esDeadlineHoy =
    ahora.getFullYear() === 2026 &&
    ahora.getMonth()    === 5    && // junio = mes 5
    ahora.getDate()     === 10;

  if (esDeadlineHoy || ahora > FECHA_CIERRE) {
    return res.status(403).json({ error: 'Las apuestas están cerradas' });
  }

  const { partidoId, golesLocal, golesVisita } = req.body;
  if (!partidoId || golesLocal == null || golesVisita == null) {
    return res.status(400).json({ error: 'Faltan datos: partidoId, golesLocal, golesVisita' });
  }
  if (Number(golesLocal) < 0 || Number(golesVisita) < 0) {
    return res.status(400).json({ error: 'Los goles no pueden ser negativos' });
  }

  const uid = req.user.uid;
  try {
    const partDoc = await db.collection('participantes').doc(uid).get();
    if (!partDoc.exists) {
      return res.status(403).json({ error: 'Primero debes unirte a un grupo' });
    }

    await db.collection('apuestas').doc(`${uid}_${partidoId}`).set({
      uid,
      grupoId:      partDoc.data().grupoId,
      partidoId,
      golesLocal:   Number(golesLocal),
      golesVisita:  Number(golesVisita),
      actualizadoEn: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Obtener mis apuestas
app.get('/api/apuestas/mias', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('apuestas')
      .where('uid', '==', req.user.uid).get();
    const apuestas = {};
    snap.docs.forEach(d => { apuestas[d.data().partidoId] = d.data(); });
    res.json(apuestas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── RESULTADOS — SOLO ADMIN ──────────────────────────────────────────────────
//
// ÚNICA ruta que escribe en la colección `partidos`.
// Doble protección: verifyToken (JWT válido de Firebase) + onlyAdmin (UID exacto).
// Un jugador que intente llamar este endpoint recibe 403 aunque esté autenticado.
// El index.html y polla.html NUNCA llaman este endpoint — solo leen /api/data.
//
app.post('/api/resultados', verifyToken, onlyAdmin, async (req, res) => {
  const { partidoId, golesLocal, golesVisita, localNombre, visitaNombre } = req.body;

  if (!partidoId || golesLocal == null || golesVisita == null) {
    return res.status(400).json({ error: 'Faltan datos: partidoId, golesLocal, golesVisita' });
  }
  if (Number(golesLocal) < 0 || Number(golesVisita) < 0) {
    return res.status(400).json({ error: 'Los goles no pueden ser negativos' });
  }

  try {
    const updateData = {
      resultado_local:  Number(golesLocal),
      resultado_visita: Number(golesVisita),
      actualizadoPor:   ADMIN_UID,
      actualizadoEn:    admin.firestore.FieldValue.serverTimestamp()
    };
    // En fases eliminatorias el admin puede fijar los nombres de equipos
    if (localNombre?.trim())  updateData.local  = localNombre.trim();
    if (visitaNombre?.trim()) updateData.visita = visitaNombre.trim();

    // set+merge: funciona aunque el partido no exista aún en Firestore
    await db.collection('partidos').doc(partidoId).set(updateData, { merge: true });

    // Recalcular puntajes de todas las apuestas de este partido
    const apuestasSnap = await db.collection('apuestas')
      .where('partidoId', '==', partidoId).get();

    if (apuestasSnap.size > 0) {
      const batch = db.batch();
      apuestasSnap.docs.forEach(docRef => {
        const a = docRef.data();
        const pts = calcularPuntaje(
          { local: Number(golesLocal),  visita: Number(golesVisita) },
          { local: a.golesLocal,        visita: a.golesVisita }
        );
        batch.update(docRef.ref, {
          puntaje:       pts,
          recalculadoEn: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
    }

    res.json({ ok: true, apuestasActualizadas: apuestasSnap.size });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── RANKING ──────────────────────────────────────────────────────────────────

// Ranking de un grupo (público, para jugadores)
app.get('/api/ranking/:grupoId', async (req, res) => {
  try {
    const { grupoId } = req.params;
    const [partSnap, apSnap] = await Promise.all([
      db.collection('participantes').where('grupoId', '==', grupoId).get(),
      db.collection('apuestas').where('grupoId', '==', grupoId).get()
    ]);

    const puntajes = {};
    partSnap.docs.forEach(d => {
      puntajes[d.data().uid] = { ...d.data(), total: 0, aciertos: 0 };
    });
    apSnap.docs.forEach(d => {
      const a = d.data();
      if (a.puntaje != null && puntajes[a.uid]) {
        puntajes[a.uid].total += a.puntaje;
        if (a.puntaje > 0) puntajes[a.uid].aciertos++;
      }
    });

    res.json(
      Object.values(puntajes)
        .sort((a, b) => b.total - a.total)
        .map((p, i) => ({ ...p, posicion: i + 1 }))
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ranking global (solo admin)
app.get('/api/ranking', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const [partSnap, apSnap] = await Promise.all([
      db.collection('participantes').get(),
      db.collection('apuestas').get()
    ]);

    const participantes = {};
    partSnap.docs.forEach(d => {
      participantes[d.data().uid] = { ...d.data(), total: 0, aciertos: 0 };
    });
    apSnap.docs.forEach(d => {
      const a = d.data();
      if (a.puntaje != null && participantes[a.uid]) {
        participantes[a.uid].total += a.puntaje;
        if (a.puntaje > 0) participantes[a.uid].aciertos++;
      }
    });

    res.json(Object.values(participantes).sort((a, b) => b.total - a.total));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API corriendo en http://localhost:${PORT}`));
