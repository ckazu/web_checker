# web_checker

## デプロイ方法

### リポジトリのクローン

本リポジトリを任意のディレクトリに clone してください。

以下の作業は、リポジトリのルートディレクトリ直下で行ってください。

### Firebase プロジェクトの作成

Firebase にアクセスして( https://console.firebase.google.com/ )、新規プロジェクトを作成してください
* Google アナリティクスは使用しないため、`今は設定しない` を選択してください

左下の `Spark アップグレード` の部分から、アップグレードを選択して、料金プランを `Blaze 従量制` に変更してください。
* もし、`請求先アカウント` が存在しない場合は、先に Google Cloud Platform から請求先情報を作成してください。

### firebase CLI の準備

firebase CLI がインストールされていない場合は、以下にしたがってあらかじめインストールしてください

``` shell
$ npm install -g firebase-tools
```

ref: https://firebase.google.com/docs/cli?hl=ja

### firebase CLI の認証

以下のコマンドを実行して、Google 認証を済ませてください

``` shell
$ firebase login

```

### Firebase プロジェクトと作業ディレクトリとの紐付け

以下のコマンドを実行して、プロジェクトに紐付けてください

``` shell
$ firebase use --add
```

* 先に作成した firebase プロジェクトを選択してください
* `What alias do you want to use for this project? (e.g. staging)`
    * 何でも構いません。 production など。

これにより、 `.firebaserc` ファイルが生成されていることを確認してください

### デプロイ準備 (Authentication)

* Firebase コンソールから `Authentication` を選択
* `ログイン方法を設定` から、以下を選択し完了してください
    * `Google` を選択
        * 右上の `有効にする` をチェック
        * `プロジェクトのサポートメール` は任意のものを設定

### デプロイ準備 (firestore)

* Firebase コンソールから `Database` を選択
* `データベースの作成` から、以下を選択し完了してください
    * `ロックモードで開始`
    * `nam5 (us-central)`

### デプロイ準備 (functions)

以下のコマンドで node ライブラリのインストールをしてください

``` shell
$ cd functions
$ npm install
$ cd ../
```

### デプロイ準備 (slack)

slack から Webhook token を発行し、以下のコマンドで firebase の環境変数に設定してください。
``` shell
$ firebase functions:config:set slack.url='https://hooks.slack.com/services/xxxxx/xxxxx/xxxxxxxxxxxxx'
```

### デプロイ

以下のコマンドを実行してデプロイを実行してください

``` shell
$ firebase deploy
```

``` shell
=== Deploying to 'xxx'...

i  deploying firestore, functions, hosting
i  firestore: checking firestore.rules for compilation errors...
i  firestore: reading indexes from firestore.indexes.json...
✔  firestore: rules file firestore.rules compiled successfully
i  functions: ensuring necessary APIs are enabled...
✔  functions: all necessary APIs are enabled
i  firestore: uploading rules firestore.rules...
✔  firestore: deployed indexes in firestore.indexes.json successfully
i  functions: preparing ./functions directory for uploading...
i  functions: packaged ./functions (84.06 KB) for uploading
✔  functions: ./functions folder uploaded successfully
i  hosting[xxx]: beginning deploy...
i  hosting[xxx]: found 7 files in public
✔  hosting[xxx]: file upload complete
✔  firestore: released rules firestore.rules to cloud.firestore
i  functions: creating Node.js 8 function webFetcher(us-central1)...
i  functions: creating Node.js 8 function webCrawler(us-central1)...
i  functions: creating Node.js 8 function slackNotifier(us-central1)...
i  functions: creating Node.js 8 function sendWelcomeEmail(us-central1)...
i  scheduler: ensuring necessary APIs are enabled...
i  pubsub: ensuring necessary APIs are enabled...
⚠  scheduler: missing necessary APIs. Enabling now...
✔  pubsub: all necessary APIs are enabled
✔  scheduler: all necessary APIs are enabled
✔  functions: created scheduler job firebase-schedule-webFetcher-us-central1
✔  functions[webFetcher(us-central1)]: Successful create operation.
✔  functions[webCrawler(us-central1)]: Successful create operation.
✔  functions[sendWelcomeEmail(us-central1)]: Successful create operation.
✔  functions[slackNotifier(us-central1)]: Successful create operation.
i  hosting[xxx]: finalizing version...
✔  hosting[xxx]: version finalized
i  hosting[xxx]: releasing new version...
✔  hosting[xxx]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/xxx/overview
Hosting URL: https://xxx.firebaseapp.com
```

`Hosting URL: https://<project-id>.firebaseapp.com`

デプロイ成功時にログに表示される↑の URL にアクセスして、管理画面が表示されることを確認してください
