const slackNotifierLib = async (slack, message) => {
  console.log('send to slack');
  slack.send(message);
};

module.exports = slackNotifierLib;
