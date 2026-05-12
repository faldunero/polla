const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'frontend')));

const PROJECT_ID = 'polla-495421-ab029';
const ADMIN_EMAIL = 'faldunate@gmail.com';

// Fecha límite: 1 día antes del inicio del Mundial 2026 (11 junio 2026)
const FECHA_CIERRE = new Date('2026-06-10T23:59:59-05:00');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: PROJECT_ID
});

const db = admin.firestore();

// ─── Middleware: verificar token Firebase ───────────────────────────────────
async function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const token = auth.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ─── Middleware: solo admin ─────────────────────────────────────────────────
function onlyAdmin(req, res, next) {
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Solo el administrador puede hacer esto' });
  }
  next();
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function calcularPuntaje(real, apuesta) {
  // real y apuesta = { local: N, visita: N }
  if (real.local == null || real.visita == null) return null; // partido sin resultado aún

  const realEmpate = real.local === real.visita;
  const apuestaEmpate = apuesta.local === apuesta.visita;
  const resultadoExacto =
    Number(apuesta.local) === Number(real.local) &&
    Number(apuesta.visita) === Number(real.visita);

  if (resultadoExacto && !realEmpate) return 4; // resultado exacto con ganador
  if (resultadoExacto && realEmpate)  return 2; // resultado exacto empate

  // ganador correcto (no exacto)
  const ganadorReal    = real.local > real.visita ? 'L' : real.local < real.visita ? 'V' : 'E';
  const ganadorApuesta = apuesta.local > apuesta.visita ? 'L' : apuesta.local < apuesta.visita ? 'V' : 'E';

  if (ganadorReal === ganadorApuesta && ganadorReal !== 'E') return 3; // ganador correcto
  if (ganadorReal === 'E' && ganadorApuesta === 'E')         return 1; // empate no exacto

  return 0;
}

// ─── DATA GENERAL ───────────────────────────────────────────────────────────
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
    res.status(500).send(e.message);
  }
});

// ─── GRUPOS ─────────────────────────────────────────────────────────────────

// Listar grupos públicos
app.get('/api/grupos', async (req, res) => {
  try {
    const snap = await db.collection('grupos').get();
    const grupos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(grupos);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Crear grupo (solo admin)
app.post('/api/grupos', verifyToken, onlyAdmin, async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre' });
  try {
    const ref = await db.collection('grupos').add({
      nombre,
      descripcion: descripcion || '',
      creadoEn: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: ref.id, nombre, descripcion });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Eliminar grupo (solo admin)
app.delete('/api/grupos/:id', verifyToken, onlyAdmin, async (req, res) => {
  try {
    await db.collection('grupos').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ─── PARTICIPANTES ──────────────────────────────────────────────────────────

// Unirse a un grupo
app.post('/api/grupos/:grupoId/unirse', verifyToken, async (req, res) => {
  const { grupoId } = req.params;
  const uid = req.user.uid;
  const email = req.user.email;
  const nombre = req.user.name || email;

  try {
    const grupoRef = db.collection('grupos').doc(grupoId);
    const grupoDoc = await grupoRef.get();
    if (!grupoDoc.exists) return res.status(404).json({ error: 'Grupo no encontrado' });

    // Verificar si ya está en otro grupo
    const yaEnSnap = await db.collection('participantes')
      .where('uid', '==', uid).get();
    if (!yaEnSnap.empty) {
      const actual = yaEnSnap.docs[0].data();
      if (actual.grupoId !== grupoId) {
        return res.status(400).json({ error: `Ya estás en el grupo "${actual.grupoNombre}"` });
      }
      return res.json({ ok: true, mensaje: 'Ya estás en este grupo' });
    }

    await db.collection('participantes').doc(uid).set({
      uid, email, nombre,
      grupoId,
      grupoNombre: grupoDoc.data().nombre,
      unidoEn: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Obtener participante actual
app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('participantes').doc(req.user.uid).get();
    if (!doc.exists) return res.json(null);
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ─── APUESTAS ───────────────────────────────────────────────────────────────

// Guardar/actualizar apuesta de un partido
app.post('/api/apuestas', verifyToken, async (req, res) => {
  // Verificar cierre
  if (new Date() > FECHA_CIERRE) {
    return res.status(403).json({ error: 'Las apuestas están cerradas' });
  }

  const { partidoId, golesLocal, golesVisita } = req.body;
  if (!partidoId || golesLocal == null || golesVisita == null) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const uid = req.user.uid;

  try {
    // Verificar que el usuario esté en algún grupo
    const partDoc = await db.collection('participantes').doc(uid).get();
    if (!partDoc.exists) {
      return res.status(403).json({ error: 'Primero debes unirte a un grupo' });
    }

    const apuestaId = `${uid}_${partidoId}`;
    await db.collection('apuestas').doc(apuestaId).set({
      uid,
      grupoId: partDoc.data().grupoId,
      partidoId,
      golesLocal: Number(golesLocal),
      golesVisita: Number(golesVisita),
      actualizadoEn: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Obtener mis apuestas
app.get('/api/apuestas/mias', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('apuestas')
      .where('uid', '==', req.user.uid).get();
    const apuestas = {};
    snap.docs.forEach(d => {
      const data = d.data();
      apuestas[data.partidoId] = data;
    });
    res.json(apuestas);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ─── RESULTADOS (solo admin) ─────────────────────────────────────────────────
app.post('/api/resultados', verifyToken, onlyAdmin, async (req, res) => {
  const { partidoId, golesLocal, golesVisita } = req.body;
  if (!partidoId || golesLocal == null || golesVisita == null) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    // Guardar resultado en el partido
    await db.collection('partidos').doc(partidoId).update({
      resultado_local: Number(golesLocal),
      resultado_visita: Number(golesVisita)
    });

    // Recalcular puntajes para todas las apuestas de este partido
    const apuestasSnap = await db.collection('apuestas')
      .where('partidoId', '==', partidoId).get();

    const batch = db.batch();
    apuestasSnap.docs.forEach(doc => {
      const a = doc.data();
      const pts = calcularPuntaje(
        { local: Number(golesLocal), visita: Number(golesVisita) },
        { local: a.golesLocal, visita: a.golesVisita }
      );
      batch.update(doc.ref, { puntaje: pts });
    });
    await batch.commit();

    res.json({ ok: true, apuestasActualizadas: apuestasSnap.size });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ─── SOLICITUDES (participantes con estado) ──────────────────────────────────

// Listar todos los participantes con su estado (solo admin)
app.get('/api/solicitudes', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const snap = await db.collection('participantes').get();
    const participantes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Ordenar: primero pendientes, luego aprobados, luego rechazados
    const orden = { pendiente: 0, aprobado: 1, rechazado: 2 };
    participantes.sort((a, b) => {
      const ea = orden[a.estado || 'pendiente'] ?? 0;
      const eb = orden[b.estado || 'pendiente'] ?? 0;
      return ea - eb;
    });
    res.json(participantes);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Cambiar estado de una solicitud (solo admin)
app.patch('/api/solicitudes/:uid', verifyToken, onlyAdmin, async (req, res) => {
  const { uid } = req.params;
  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'aprobado', 'rechazado'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido. Usa: pendiente, aprobado, rechazado' });
  }
  try {
    await db.collection('participantes').doc(uid).update({
      estado,
      estadoActualizadoEn: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ ok: true, uid, estado });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ─── RANKING ────────────────────────────────────────────────────────────────
app.get('/api/ranking/:grupoId', async (req, res) => {
  try {
    const { grupoId } = req.params;

    // Todos los participantes del grupo
    const partSnap = await db.collection('participantes')
      .where('grupoId', '==', grupoId).get();

    // Todas las apuestas del grupo
    const apSnap = await db.collection('apuestas')
      .where('grupoId', '==', grupoId).get();

    // Sumar puntajes por usuario
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

    const ranking = Object.values(puntajes)
      .sort((a, b) => b.total - a.total)
      .map((p, i) => ({ ...p, posicion: i + 1 }));

    res.json(ranking);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Ranking de todos los grupos (para el admin)
app.get('/api/ranking', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const apSnap = await db.collection('apuestas').get();
    const partSnap = await db.collection('participantes').get();

    const participantes = {};
    partSnap.docs.forEach(d => {
      participantes[d.data().uid] = { ...d.data(), total: 0 };
    });

    apSnap.docs.forEach(d => {
      const a = d.data();
      if (a.puntaje != null && participantes[a.uid]) {
        participantes[a.uid].total += a.puntaje;
      }
    });

    res.json(Object.values(participantes).sort((a, b) => b.total - a.total));
  } catch (e) {
    res.status(500).send(e.message);
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 API corriendo en http://localhost:${PORT}`));
