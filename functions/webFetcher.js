const rp = require('request-promise');
const cronParser = require('cron-parser');
const moment = require('moment-timezone');

const webFetcher = async (firestore) => {
  const schedules = await firestore.collection('schedules').get();
  return await schedules.forEach(async schedule => {
    if(isAlreadyChecked(schedule.data())) { return; }
    await rp({
      method: 'POST',
      uri: "https://us-central1-web-checker-a0a66.cloudfunctions.net/webCrawler",
      body: { scheduleId: schedule.id },
      json: true
    });
    await firestore.collection('schedules').doc(schedule.id).set({
      checkedAt: +new Date
    }, { merge: true });
  });
};

module.exports = webFetcher;

const isAlreadyChecked = (schedule) => {
  if(typeof schedule.checkedAt === 'undefined') { return false; }
  let crontab = schedule.schedule;
  const prev = cronParser.parseExpression('0 * * * *', { tz: 'Asia/Tokyo'}).prev().toDate();
  const checked = moment(schedule.checkedAt).toDate();

  console.log('crontab check(checked):  ', checked);
  console.log('crontab check(prev):     ', prev);
  console.log('crontab check: ', prev < checked);
  return (prev < checked);
};
