const rp = require('request-promise');
const moment = require('moment-timezone');
const crawler = require('./lib/crawler');
const slackDiff = require('./lib/slack_diff');

// todo: refactor
const webCrawlerLib = async (firestore, pubsub, scheduleId) => {
  const scheduleRef = await firestore.doc(`schedules/${scheduleId}`);
  const scheduleDoc = await scheduleRef.get();
  const schedule = scheduleDoc.data();

  console.log('crawlerLib: ', schedule.title);

  let before = +new Date;
  let text = await crawler(encodeURI(schedule.uri), schedule.selector);

  text = text.replace(/\t+\n/g, '\n').replace(/\s+/g, ' \n').replace(/\n+/g, '\n').replace(/\t+/g, '\t').replace(/^\s*$/, '');

  const latestArchiveSnapshot = await firestore.collection(`schedules/${scheduleDoc.id}/archives`).orderBy('time', 'desc').limit(1).get();

  let latestArchive;
  latestArchiveSnapshot.forEach(archive => { latestArchive = archive.data(); });

  let diff;
  if(latestArchive) { diff = slackDiff(text, latestArchive.content, 'words'); }

  if(diff == '') {
    console.log('no diff: ', schedule.title);
  } else {
    const time = new Date();
    let latestTime = '-';
    if(latestArchive) { latestTime = moment(latestArchive.time).tz('Asia/Tokyo').format(); }

    await firestore.collection(`schedules/${scheduleDoc.id}/archives`).add({ content: text, time: +time });

    const data = JSON.stringify(slackFormat(schedule, time, latestTime, text, diff));
    const dataBuffer = Buffer.from(data);
    await pubsub.topic('slackNotifier').publish(dataBuffer);
    console.log('publish slackNotifier: ', schedule.title);
  }
  return await scheduleRef.set({ checkedAt: +new Date }, { merge: true });
};

module.exports = webCrawlerLib;

// todo: classify arguments
const slackFormat = (schedule, time, latestTime, text, diff) => {
  let titleText;
  if(latestTime == '-') {
    titleText = `[${schedule.title}] が新規追加されました`;
  } else {
    titleText = `[${schedule.title}] で更新が検知されました`;
  }

  return {
    attachments: [
      {
        title: titleText,
        title_link: schedule.uri,
        color: 'good',
        fields: [
          { title: '更新検知日時', value: moment(time).tz('Asia/Tokyo').format(), short: true },
          { title: '前回の更新日時', value: latestTime, short: true }
        ]
      }, {
        fields: [
          { title: '更新内容', value: (text.length <= 100 ? text : text.slice(0, 97) + '...'), short: false },
          { title: '差分', value: diff, short: false }
        ]
      }
    ]
  };
};
