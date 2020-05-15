process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const cheerio = require('cheerio');
const jschardet = require('jschardet');

const rp = require('promise-request-retry');

const crawler = async (uri, selector, fetchAsHtml) => {
  console.log('crawl: ', uri);
  // todo: validation
  if (typeof uri === 'undefined' || uri === null) { throw new Error('invalid URI'); }
  if (typeof selector === 'undefined' || selector === null) { selector = 'body'; }

  options = {
    retry: 3,
    uri: uri,
    encoding: 'binary',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36' },
    followAllRedirects: true,
    transform: (body) => {
      const encoding = jschardet.detect(body).encoding
      const iconv = require('iconv-lite')
      const buf = new Buffer.from(body, 'binary')
      const convertedString = iconv.decode(buf, encoding)

      return cheerio.load(convertedString, { decodeEntities: false });
    }
  };

  try {
    const $ = await rp(options);
    if (fetchAsHtml) {
      return $(selector).html();
    } else {
      var result = [];
      $(selector).map((i, dom) => { result.push($(dom).text()); });
      return result.join("\n");
    }
  } catch (err) {
    throw err;
  }
};

module.exports = crawler;
