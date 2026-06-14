// api/fifa.js — Vercel serverless function proxy para la API de FIFA
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { count = 500, status } = req.query;
    let url = `https://api.fifa.com/api/v3/calendar/matches?language=es&count=${count}&idSeason=285023`;
    if (status) url += `&matchStatus=${status}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.fifa.com/',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `FIFA API error: ${response.status}` });
    }

    const data = await response.json();

    // Mapear al formato de tu app
    const partidos = (data.Results || []).map(m => ({
      id: m.PlaceHolderA || m.IdMatch,          // A1, B2, etc — coincide con Firestore
      idFifa: m.IdMatch,
      local: m.Home?.TeamName?.[0]?.Description || '',
      visita: m.Away?.TeamName?.[0]?.Description || '',
      scoreLocal: m.HomeTeamScore,
      scoreVisita: m.AwayTeamScore,
      estadio: m.Stadium?.Name?.[0]?.Description || '',
      ciudad: m.Stadium?.CityName?.[0]?.Description || '',
      fecha: m.Date,
      grupo: m.GroupName?.[0]?.Description || '',
      fase: m.StageName?.[0]?.Description || '',
      estado: m.MatchStatus, // 0=terminado, 1=no iniciado, 3=en curso
      minuto: m.MatchTime || '',
      penalLocal: m.HomeTeamPenaltyScore,
      penalVisita: m.AwayTeamPenaltyScore,
    }));

    res.status(200).json({ ok: true, total: partidos.length, partidos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
