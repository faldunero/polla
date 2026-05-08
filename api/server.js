const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const PROJECT_ID = 'polla-495421-ab029';
const ADMIN_EMAIL = 'faldunate@gmail.com';
const FECHA_CIERRE = new Date('2026-06-10T23:59:59-05:00');

// ─── NODEMAILER ───────────────────────────────────────────────────────────
// Reemplaza con tu Gmail y contraseña de aplicación (16 chars sin espacios)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'TU_GMAIL@gmail.com',
    pass: 'XXXX XXXX XXXX XXXX'
  }
});

async function sendMail({ to, subject, html }) {
  try {
    await transporter.sendMail({ from: '"La Polla 2026 ⚽" <TU_GMAIL@gmail.com>', to, subject, html });
    console.log(`📧 Email → ${to}`);
  } catch (e) { console.error('Email error:', e.message); }
}

// ─── FIREBASE ─────────────────────────────────────────────────────────────
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')), projectId: PROJECT_ID });
const db = admin.firestore();

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────
async function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  try { req.user = await admin.auth().verifyIdToken(auth.split('Bearer ')[1]); next(); }
  catch { res.status(401).json({ error: 'Token inválido' }); }
}
function onlyAdmin(req, res, next) {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Solo el administrador' });
  next();
}

// ─── PUNTAJE ──────────────────────────────────────────────────────────────
function calcularPuntaje(real, apuesta) {
  if (real.local == null) return null;
  const exacto = Number(apuesta.local) === Number(real.local) && Number(apuesta.visita) === Number(real.visita);
  const empateReal = real.local === real.visita;
  if (exacto && !empateReal) return 4;
  if (exacto && empateReal)  return 2;
  const gr = real.local > real.visita ? 'L' : real.local < real.visita ? 'V' : 'E';
  const ga = apuesta.local > apuesta.visita ? 'L' : apuesta.local < apuesta.visita ? 'V' : 'E';
  if (gr === ga && gr !== 'E') return 3;
  if (gr === 'E' && ga === 'E') return 1;
  return 0;
}

// ─── FCM PUSH AL ADMIN ────────────────────────────────────────────────────
async function pushAdmin(title, body) {
  try {
    const key = ADMIN_EMAIL.replace(/[@.]/g, '_');
    const doc = await db.collection('fcm_tokens').doc(key).get();
    if (!doc.exists) return;
    await admin.messaging().send({ token: doc.data().token, notification: { title, body } });
    console.log('🔔 Push al admin');
  } catch (e) { console.error('FCM:', e.message); }
}

// ─── FCM TOKEN ────────────────────────────────────────────────────────────
app.post('/api/fcm-token', verifyToken, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Falta token' });
  const key = req.user.email.replace(/[@.]/g, '_');
  await db.collection('fcm_tokens').doc(key).set({ token, email: req.user.email, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  res.json({ ok: true });
});

// ─── DATA GENERAL ─────────────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  try {
    const [p, pa, e] = await Promise.all([db.collection('paises').get(), db.collection('partidos').get(), db.collection('estadios').get()]);
    res.json({ paises: p.docs.map(d => ({ id: d.id, ...d.data() })), partidos: pa.docs.map(d => ({ id: d.id, ...d.data() })), estadios: e.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).send(e.message); }
});

// ─── GRUPOS ───────────────────────────────────────────────────────────────
app.get('/api/grupos', async (req, res) => {
  try { const s = await db.collection('grupos').get(); res.json(s.docs.map(d => ({ id: d.id, ...d.data() }))); }
  catch (e) { res.status(500).send(e.message); }
});
app.post('/api/grupos', verifyToken, onlyAdmin, async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta nombre' });
  try { const r = await db.collection('grupos').add({ nombre, descripcion: descripcion || '', creadoEn: admin.firestore.FieldValue.serverTimestamp() }); res.json({ id: r.id, nombre, descripcion }); }
  catch (e) { res.status(500).send(e.message); }
});
app.put('/api/grupos/:id', verifyToken, onlyAdmin, async (req, res) => {
  try { await db.collection('grupos').doc(req.params.id).update({ nombre: req.body.nombre, descripcion: req.body.descripcion }); res.json({ ok: true }); }
  catch (e) { res.status(500).send(e.message); }
});
app.delete('/api/grupos/:id', verifyToken, onlyAdmin, async (req, res) => {
  try { await db.collection('grupos').doc(req.params.id).delete(); res.json({ ok: true }); }
  catch (e) { res.status(500).send(e.message); }
});

// ─── SOLICITUDES ──────────────────────────────────────────────────────────
app.post('/api/grupos/:grupoId/solicitar', verifyToken, async (req, res) => {
  if (new Date() > FECHA_CIERRE) return res.status(403).json({ error: 'Inscripciones cerradas' });
  const { uid, email } = req.user;
  const nombre = req.user.name || email;
  try {
    const grupoDoc = await db.collection('grupos').doc(req.params.grupoId).get();
    if (!grupoDoc.exists) return res.status(404).json({ error: 'Grupo no encontrado' });

    const yaSnap = await db.collection('solicitudes').where('uid', '==', uid).get();
    if (!yaSnap.empty) {
      const s = yaSnap.docs[0].data();
      if (s.estado === 'aprobado') return res.status(400).json({ error: 'Ya estás inscrito en un grupo' });
      if (s.estado === 'pendiente') return res.status(400).json({ error: 'Ya tienes una solicitud pendiente de aprobación' });
      // Si fue rechazado, permite re-solicitar eliminando la anterior
      await yaSnap.docs[0].ref.delete();
    }

    await db.collection('solicitudes').add({
      uid, email, nombre,
      photoURL: req.user.picture || '',
      grupoId: req.params.grupoId,
      grupoNombre: grupoDoc.data().nombre,
      estado: 'pendiente',
      creadoEn: admin.firestore.FieldValue.serverTimestamp()
    });

    await pushAdmin('🆕 Nueva solicitud', `${nombre} quiere unirse a "${grupoDoc.data().nombre}"`);

    await sendMail({
      to: ADMIN_EMAIL,
      subject: `Nueva solicitud — ${nombre}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;">
        <div style="background:#DA0015;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">⚽ La Polla 2026</h1></div>
        <div style="padding:24px;border:1px solid #e2e8f0;">
          <h2>Nueva solicitud de ingreso</h2>
          <p><b>Usuario:</b> ${nombre}</p><p><b>Email:</b> ${email}</p>
          <p><b>Grupo:</b> ${grupoDoc.data().nombre}</p>
          <a href="http://localhost:8080/admin.html" style="display:inline-block;margin-top:16px;background:#DA0015;color:white;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">Ver en admin →</a>
        </div>
        <div style="padding:12px;text-align:center;font-size:0.72rem;color:#888;">© 2026 Ludolab.cl · Felipe Aldunate</div>
      </div>`
    });

    res.json({ ok: true });
  } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/mi-solicitud', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('solicitudes').where('uid', '==', req.user.uid).get();
    if (snap.empty) return res.json(null);
    res.json({ id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/solicitudes', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const snap = await db.collection('solicitudes').orderBy('creadoEn', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/solicitudes/:id/aprobar', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const solDoc = await db.collection('solicitudes').doc(req.params.id).get();
    if (!solDoc.exists) return res.status(404).json({ error: 'No encontrada' });
    const s = solDoc.data();
    await db.collection('participantes').doc(s.uid).set({ uid: s.uid, email: s.email, nombre: s.nombre, photoURL: s.photoURL || '', grupoId: s.grupoId, grupoNombre: s.grupoNombre, unidoEn: admin.firestore.FieldValue.serverTimestamp() });
    await solDoc.ref.update({ estado: 'aprobado' });
    await sendMail({
      to: s.email, subject: '✅ ¡Fuiste aprobado en La Polla 2026!',
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;">
        <div style="background:#DA0015;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">⚽ La Polla 2026</h1></div>
        <div style="padding:24px;border:1px solid #e2e8f0;">
          <h2>¡Hola, ${s.nombre}! 🎉</h2>
          <p>Tu solicitud para el grupo <b>"${s.grupoNombre}"</b> fue <b style="color:#16a34a;">aprobada</b>. Ya puedes ingresar tus predicciones.</p>
          <a href="http://localhost:8080/polla.html" style="display:inline-block;margin-top:16px;background:#DA0015;color:white;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">Ir a La Polla →</a>
        </div>
        <div style="padding:12px;text-align:center;font-size:0.72rem;color:#888;">© 2026 Ludolab.cl · Felipe Aldunate</div>
      </div>`
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/solicitudes/:id/rechazar', verifyToken, onlyAdmin, async (req, res) => {
  const { motivo } = req.body;
  try {
    const solDoc = await db.collection('solicitudes').doc(req.params.id).get();
    if (!solDoc.exists) return res.status(404).json({ error: 'No encontrada' });
    const s = solDoc.data();
    await solDoc.ref.update({ estado: 'rechazado' });
    await sendMail({
      to: s.email, subject: '❌ Solicitud no aprobada — La Polla 2026',
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;">
        <div style="background:#DA0015;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">⚽ La Polla 2026</h1></div>
        <div style="padding:24px;border:1px solid #e2e8f0;">
          <h2>Hola, ${s.nombre}</h2>
          <p>Tu solicitud para el grupo <b>"${s.grupoNombre}"</b> no fue aprobada.${motivo ? ` <b>Motivo:</b> ${motivo}` : ''}</p>
          <p style="color:#6b7280;margin-top:8px;">Puedes solicitar otro grupo o contactar al administrador.</p>
        </div>
        <div style="padding:12px;text-align:center;font-size:0.72rem;color:#888;">© 2026 Ludolab.cl · Felipe Aldunate</div>
      </div>`
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).send(e.message); }
});

// ─── PARTICIPANTES ────────────────────────────────────────────────────────
app.get('/api/me', verifyToken, async (req, res) => {
  try { const d = await db.collection('participantes').doc(req.user.uid).get(); res.json(d.exists ? { id: d.id, ...d.data() } : null); }
  catch (e) { res.status(500).send(e.message); }
});
app.get('/api/participantes', verifyToken, onlyAdmin, async (req, res) => {
  try { const s = await db.collection('participantes').get(); res.json(s.docs.map(d => ({ id: d.id, ...d.data() }))); }
  catch (e) { res.status(500).send(e.message); }
});
app.delete('/api/participantes/:uid', verifyToken, onlyAdmin, async (req, res) => {
  try {
    await db.collection('participantes').doc(req.params.uid).delete();
    const apSnap = await db.collection('apuestas').where('uid', '==', req.params.uid).get();
    const batch = db.batch(); apSnap.docs.forEach(d => batch.delete(d.ref)); await batch.commit();
    // También resetear solicitud
    const solSnap = await db.collection('solicitudes').where('uid', '==', req.params.uid).get();
    const b2 = db.batch(); solSnap.docs.forEach(d => b2.delete(d.ref)); await b2.commit();
    res.json({ ok: true });
  } catch (e) { res.status(500).send(e.message); }
});

// ─── APUESTAS ─────────────────────────────────────────────────────────────
app.post('/api/apuestas', verifyToken, async (req, res) => {
  if (new Date() > FECHA_CIERRE) return res.status(403).json({ error: 'Apuestas cerradas' });
  const { partidoId, golesLocal, golesVisita } = req.body;
  if (!partidoId || golesLocal == null || golesVisita == null) return res.status(400).json({ error: 'Faltan datos' });
  try {
    const p = await db.collection('participantes').doc(req.user.uid).get();
    if (!p.exists) return res.status(403).json({ error: 'Debes estar en un grupo aprobado' });
    await db.collection('apuestas').doc(`${req.user.uid}_${partidoId}`).set({ uid: req.user.uid, grupoId: p.data().grupoId, partidoId, golesLocal: Number(golesLocal), golesVisita: Number(golesVisita), actualizadoEn: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ ok: true });
  } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/apuestas/mias', verifyToken, async (req, res) => {
  try {
    const s = await db.collection('apuestas').where('uid', '==', req.user.uid).get();
    const r = {}; s.docs.forEach(d => { const a = d.data(); r[a.partidoId] = a; }); res.json(r);
  } catch (e) { res.status(500).send(e.message); }
});

// ─── RESULTADOS ───────────────────────────────────────────────────────────
app.post('/api/resultados', verifyToken, onlyAdmin, async (req, res) => {
  const { partidoId, golesLocal, golesVisita } = req.body;
  if (!partidoId || golesLocal == null || golesVisita == null) return res.status(400).json({ error: 'Faltan datos' });
  try {
    await db.collection('partidos').doc(partidoId).update({ resultado_local: Number(golesLocal), resultado_visita: Number(golesVisita) });
    const apSnap = await db.collection('apuestas').where('partidoId', '==', partidoId).get();
    const batch = db.batch();
    apSnap.docs.forEach(doc => { const a = doc.data(); batch.update(doc.ref, { puntaje: calcularPuntaje({ local: Number(golesLocal), visita: Number(golesVisita) }, { local: a.golesLocal, visita: a.golesVisita }) }); });
    await batch.commit();
    res.json({ ok: true, apuestasActualizadas: apSnap.size });
  } catch (e) { res.status(500).send(e.message); }
});

// ─── RANKING ──────────────────────────────────────────────────────────────
app.get('/api/ranking/:grupoId', async (req, res) => {
  try {
    const [pS, aS] = await Promise.all([db.collection('participantes').where('grupoId', '==', req.params.grupoId).get(), db.collection('apuestas').where('grupoId', '==', req.params.grupoId).get()]);
    const pts = {}; pS.docs.forEach(d => { pts[d.data().uid] = { ...d.data(), total: 0, aciertos: 0 }; });
    aS.docs.forEach(d => { const a = d.data(); if (a.puntaje != null && pts[a.uid]) { pts[a.uid].total += a.puntaje; if (a.puntaje > 0) pts[a.uid].aciertos++; } });
    res.json(Object.values(pts).sort((a, b) => b.total - a.total).map((p, i) => ({ ...p, posicion: i + 1 })));
  } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/ranking', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const [aS, pS] = await Promise.all([db.collection('apuestas').get(), db.collection('participantes').get()]);
    const ps = {}; pS.docs.forEach(d => { ps[d.data().uid] = { ...d.data(), total: 0 }; });
    aS.docs.forEach(d => { const a = d.data(); if (a.puntaje != null && ps[a.uid]) ps[a.uid].total += a.puntaje; });
    res.json(Object.values(ps).sort((a, b) => b.total - a.total));
  } catch (e) { res.status(500).send(e.message); }
});

const PORT = 3000;
module.exports = app; // app.listen(PORT, () => console.log(`🚀 API en http://localhost:${PORT}`));
