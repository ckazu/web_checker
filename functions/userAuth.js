const userAuth = async (admin, functions, user) => {
  const IncomingWebhook = require('@slack/client').IncomingWebhook;
  const slack = new IncomingWebhook(functions.config().slack.url);

  await admin.auth().updateUser(user.uid, { disabled: true });

  await slack.send({
    text: `[WEB CHECKER] ユーザが新規登録されました`,
    attachments: [{
      title: "有効なユーザの場合、Firebase 管理ツールからアカウントを有効にしてください",
      title_link: "https://console.firebase.google.com",
      fields: [
        { title: "email", value: user.email },
        { title: "name", value: user.displayName }
      ]
    }]
  });
};

module.exports = userAuth;
