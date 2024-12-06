require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const urlParser = require('url-parser');

const urlSchema = mongoose.Schema({
  original_url: String,
  short_url: Number
})

const Url = mongoose.model('Url', urlSchema)


mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongoose connected successfully"))
  .catch((err) => console.log("Mongoose connection error!", err)
  )

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async(req, res) => {
  let { url } = req.body;
  dns.lookup(urlParser.parse(url).hostname, async (err, address) => {
    if (!address) return res.json({ error: "Invalid Url" });
    let urlCount = await Url.countDocuments({});
    let urlDocument = {
      original_url: url,
      short_url: urlCount
    }
    let result = await Url.create(urlDocument);
    console.log(result);
    return res.json({ original_url: url, short_url: urlCount})

  })
})

app.get('/api/shorturl/:visit', async(req, res) => {
  let { visit } = req.params;
  let urlData = await Url.findOne({ short_url: visit });
  if (!urlData) return res.json({ error: "No Url found!" });
  res.redirect(urlData.original_url);
})
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
