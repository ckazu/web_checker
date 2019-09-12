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
  let text = await crawler(encodeURI(schedule.uri), schedule.selector, true)
      .catch( async err => {
        console.error('crawlerLib: ', err);
        await pubsub.topic('slackNotifier').publish(slackErrorFormat(schedule, hostingUrl, err));
        throw err;
      });

  if(text === null) {
    if(new Date().getHours() == 1) {
      console.error('crawlerLib: no content: ', schedule.title);
      await pubsub.topic('slackNotifier').publish(slackNoContentErrorFormat(schedule, hostingUrl));
    }
    throw new Error(`NoContent: ${schedule.title}`);
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
          .replace(/[\t| |　]+/g, ' ').replace(/\s+\n/g, '\n');
    const oldContent = cheerio
          .load(content.replace(/<\/(.*?)>/g, '</$1>\n').replace(/<br??>/g, '<br>\n'))
          .text()
          .replace(/[\t| |　]+/g, ' ').replace(/\s+\n/g, '\n');

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
          { title: '更新内容', value: (text.length <= 200 ? text : text.slice(0, 197) + '...'), short: false },
          { title: '差分', value: diff, short: false }
        ]
      }
    ]
  };
};

const slackErrorFormat = (schedule, hostingUrl, err) => {
  const data = JSON.stringify({
    attachments: [
      { title: `[${schedule.title}] でエラーが発生しました`,
        title_link: schedule.uri,
        color: 'danger',
        fields: [
          { title: 'URL', value: schedule.uri },
          { title: 'セレクタ', value: `\`${schedule.selector}\`` },
          { title: '管理ページ', value: hostingUrl },
          { title: 'エラー内容', value: JSON.stringify(err) }
        ]
      }]
  });
  return Buffer.from(data);
};

const slackNoContentErrorFormat = (schedule, hostingUrl) => {
  const data = JSON.stringify({
    attachments: [
      { title: `[${schedule.title}] でコンテンツが存在しませんでした`,
        title_link: schedule.uri,
        color: 'warning',
        fields: [
          { title: 'URL', value: schedule.uri },
          { title: 'セレクタ', value: `\`${schedule.selector}\`` },
          { title: '管理ページ', value: hostingUrl }
        ]
      }]
  });
  return Buffer.from(data);
};
