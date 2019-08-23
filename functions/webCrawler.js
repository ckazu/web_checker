const rp = require('request-promise');
const moment = require('moment-timezone');
const crawler = require('./lib/crawler');
const slackDiff = require('./lib/slack_diff');

const webCrawlerLib = async (firestore, functions, scheduleId) => {
  const scheduleDoc = await firestore.doc(`schedules/${scheduleId}`).get();
  const schedule = scheduleDoc.data();
  console.log(schedule);

  let text = await crawler(encodeURI(schedule.uri), schedule.selector);
  text = text.replace(/\t+\n/g, '\n').replace(/\n+/g, '\n').replace(/\t+/g, '\t');

  const latestArchiveSnapshot = await firestore.collection(`schedules/${scheduleDoc.id}/archives`).orderBy('time', 'desc').limit(1).get();
  let latestArchive;
  await latestArchiveSnapshot.forEach(archive => { latestArchive = archive.data(); });

  let diff;
  if(latestArchive) {
    diff = slackDiff(text, latestArchive.content, 'chars');
  }

  if(diff == '') {
    console.log(schedule.title, ': no diff');
  } else {
    console.log(schedule.title);
    const time = new Date();
    let latestTime = '-';
    if(latestArchive) { latestTime = moment(latestArchive.time).tz('Asia/Tokyo').format(); }

    await firestore.collection(`schedules/${scheduleDoc.id}/archives`).add({ content: text, time: +time });

    console.log(schedule.title, ': send to slack');
    await sendToSlack(functions, schedule, time, latestTime, text, diff);
  }
};

module.exports = webCrawlerLib;

// todo: classify arguments
const sendToSlack = async(functions, schedule, time, latestTime, text, diff) => {
  // slack
  const IncomingWebhook = require('@slack/client').IncomingWebhook;
  const slack = new IncomingWebhook(functions.config().slack.url);

  slack.send(
    {
      attachments: [
        {
          title: `[${schedule.title}] で更新が検知されました`,
          title_link: schedule.uri,
          color: 'good',
          fields: [
            { title: '更新検知日時', value: moment(time).tz('Asia/Tokyo').format(), short: true },
            { title: '前回の更新日時', value: latestTime, short: true },
            { title: '設定変更URL', value: 'dummy', short: false }
          ],
        }, {
          fields: [
            { title: '更新内容', value: text, short: false },
            { title: '差分', value: diff, short: false }
          ]
        }
      ],
    }
  );
};
