js
// server-local.js
const app = require('./api/server');

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 API y frontend local en http://localhost:${PORT}`);
});