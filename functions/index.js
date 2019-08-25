const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();
const functions = require('firebase-functions');

const webCrawlerLib = require('./webCrawler');
const webFetcherLib = require('./webFetcher');
const authUserLib = require('./userAuth');

exports.webCrawler = functions.https.onRequest(async (req, res) => {
  const scheduleId = req.body.scheduleId;
  await webCrawlerLib(firestore, functions, scheduleId);
  res.send('ok');
});

exports.webFetcher = functions.pubsub.schedule('5 * * * *').onRun(async (context) => {
  await webFetcherLib(firestore);
});

exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  await authUserLib(admin, functions, user);
});
