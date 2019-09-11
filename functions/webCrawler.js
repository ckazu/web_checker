const rp = require('request-promise');
const moment = require('moment-timezone');
const cheerio = require('cheerio');
const crawler = require('./lib/crawler');
const slackDiff = require('./lib/slack_diff');

// todo: refactor
const webCrawlerLib = async (firestore, pubsub, scheduleId, hostingUrl) => {
  const scheduleRef = await firestore.doc(`schedules/${scheduleId}`);
  const scheduleDoc = await scheduleRef.get();
  const schedule = scheduleDoc.data();

  console.log('crawlerLib: ', schedule.title);

  let before = +new Date;
  let text = await crawler(encodeURI(schedule.uri), schedule.selector, true);
  if(text === null && (new Date().getHours() == 10)) {
    const _data = JSON.stringify({
      attachments: [
        { title: `[${schedule.title}] でコンテンツが存在しませんでした`,
          title_link: schedule.uri,
          color: 'danger',
          fields: [
            { title: 'URL', value: schedule.uri },
            { title: 'セレクタ', value: `\`${schedule.selector}\`` },
            { title: '管理ページ', value: hostingUrl }
          ]
        }]
    });
    const _dataBuffer = Buffer.from(_data);
    return await pubsub.topic('slackNotifier').publish(_dataBuffer);
  }

  const latestArchiveSnapshot = await firestore.collection(`schedules/${scheduleDoc.id}/archives`).orderBy('time', 'desc').limit(1).get();

  let latestArchive;
  latestArchiveSnapshot.forEach(archive => { latestArchive = archive.data(); });

  let diff;
  if(latestArchive) { diff = slackDiff(text, latestArchive.content, 'chars'); }

  if(diff == '') {
    console.log('no diff: ', schedule.title);
  } else {
    const time = new Date();
    let latestTime = '-';
    if(latestArchive) { latestTime = moment(latestArchive.time).tz('Asia/Tokyo').format(); }

    await firestore.collection(`schedules/${scheduleDoc.id}/archives`).add({ content: text, time: +time });

    let content = '';
    if(latestArchive) { content = latestArchive.content; }
    const newContent = cheerio
          .load(text.replace(/<\/(.*?)>/g, '</$1>\n').replace(/<br??>/g, '<br>\n'))
          .text()
          .replace(/\t+\n/g, '\n').replace(/\n+/g, '\n').replace(/\t+/g, '\t').replace(/^\s*$/, '');
    const oldContent = cheerio
          .load(content.replace(/<\/(.*?)>/g, '</$1>\n').replace(/<br??>/g, '<br>\n'))
          .text()
          .replace(/\t+\n/g, '\n').replace(/\n+/g, '\n').replace(/\t+/g, '\t').replace(/^\s*$/, '');

    const diffDisplay = slackDiff(newContent, oldContent, 'lines');
    const data = JSON.stringify(slackFormat(hostingUrl, scheduleId, schedule, time, latestTime, newContent, diffDisplay));
    const dataBuffer = Buffer.from(data);
    await pubsub.topic('slackNotifier').publish(dataBuffer);
    console.log('publish slackNotifier: ', schedule.title);
  }
  return await scheduleRef.set({ checkedAt: +new Date }, { merge: true });
};

module.exports = webCrawlerLib;

// todo: classify arguments
const slackFormat = (hostingUrl, scheduleId, schedule, time, latestTime, text, diff) => {
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
          { title: '前回の更新日時', value: latestTime, short: true },
          { title: '差分一覧', value: `${hostingUrl}/detail.html?scheduleId=${scheduleId}` }

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
