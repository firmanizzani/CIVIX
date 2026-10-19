import app from './app.js';
import { PORT } from './config/index.js';

app.listen(PORT, () => {
  console.log(`CIVIX API berjalan di http://localhost:${PORT}`);
});
