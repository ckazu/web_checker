const admin = require('firebase-admin');
admin.initializeApp();
const firestore = admin.firestore();
const functions = require('firebase-functions');
const { PubSub } = require('@google-cloud/pubsub');
const pubsub = new PubSub();

const HOSTING_URL = functions.config().hosting_url || `https://${JSON.parse(process.env.FIREBASE_CONFIG).projectId}.firebaseapp.com`;

const IncomingWebhook = require('@slack/client').IncomingWebhook;
const slack = new IncomingWebhook(functions.config().slack.url);

const webCrawlerLib = require('./webCrawler');
const webFetcherLib = require('./webFetcher');
const authUserLib = require('./userAuth');
const slackNotifierLib = require('./slackNotifier');

exports.webFetcher = functions.pubsub.schedule('5 * * * *').onRun(async (context) => {
  await webFetcherLib(firestore, pubsub);
});

exports.webCrawler = functions.runWith({ memory: "512MB" }).pubsub.topic('webChecker').onPublish(async (message) => {
  const scheduleId = message.json.scheduleId;
  await webCrawlerLib(firestore, pubsub, scheduleId, HOSTING_URL);
});

exports.webCrawlerOnWrite = functions.runWith({ memory: "512MB" }).firestore.document('schedules/{scheduleID}').onWrite(async (change, context) => {
  if(change.after.data()) {
    if((typeof change.before.data() == 'undefined') ||
       (change.before.data().uri != change.after.data().uri) ||
       (change.before.data().selector != change.after.data().selector)) {
      const scheduleId = context.params.scheduleID;
      await webCrawlerLib(firestore, pubsub, scheduleId, HOSTING_URL);
    }
  }
});

exports.slackNotifier = functions.pubsub.topic('slackNotifier').onPublish(async (message) => {
  await slackNotifierLib(slack, message.json);
});

exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  await authUserLib(admin, pubsub, user);
});
