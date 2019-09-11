const rp = require('request-promise');
const cronParser = require('cron-parser');
const moment = require('moment-timezone');

const webFetcher = async (firestore, pubsub) => {
  const schedules = await firestore.collection('schedules').get();

  return await schedules.forEach(async schedule => {
    if(isAlreadyChecked(schedule.data())) { return; }

    console.log('publish webChecker', schedule.data().title);
    const data = JSON.stringify({ scheduleId: schedule.id });
    const dataBuffer = Buffer.from(data);
    await pubsub.topic('webChecker').publish(dataBuffer);
  });
};

module.exports = webFetcher;

const isAlreadyChecked = (schedule) => {
  if(typeof schedule.checkedAt === 'undefined') { return false; }
  let crontab = schedule.schedule;
  const prev = cronParser.parseExpression('* * * * *', { tz: 'Asia/Tokyo'}).prev().toDate();
  const checked = moment(schedule.checkedAt).toDate();
  return (prev < checked);
};
