const app = require('./server/app');

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Local Nook running on port ${PORT}`);
});