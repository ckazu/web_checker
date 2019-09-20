const slackNotifierLib = async (slack, message) => {
  console.log('send to slack', message);
  slack.send(message);
};

module.exports = slackNotifierLib;
