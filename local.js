import app from './server.js';
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`DevScope AI Server running locally on port ${PORT}`);
});
