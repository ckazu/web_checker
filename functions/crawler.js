const cheerio = require('cheerio');
const rp = require('request-promise');

const crawler = async (uri, selector, fetchAsHtml) => {
  // todo: validation
  if(typeof uri === 'undefined' || uri === null) { throw new Error('invalid URI'); }
  if(typeof selector === 'undefined' || selector === null) { selector = 'body'; }

  options = {
    uri: uri,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36' },
    followAllRedirects: true,
    transform: (body) => { return cheerio.load(body); }
  };

  try {
    const $ = await rp(options);
    if(fetchAsHtml) { return $(selector).html(); }
    else            { return $(selector).text(); }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = crawler;
