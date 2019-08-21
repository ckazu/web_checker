const jsdiff = require('diff');

const slackDiff = (newStr, oldStr) => {
  if(typeof newStr === 'undefined') { throw new Error('invalid newStr'); }

  if(newStr === null) { newStr = ""; }
  if(typeof oldStr === 'undefined' || oldStr === null) { oldStr = ""; }

  var diffStr = '';
  jsdiff.diffLines(oldStr, newStr).forEach( (d) => {
    if(!d.value.match((/^\n+$/))) {
      if(d.added) {
        diffStr += `+ ${d.value.trim().replace(/\n/g, '\n  ')}\n`;
      } else if (d.removed) {
        diffStr += `- ~${d.value.trim().replace(/\n/g, '~\n  ~')}~\n`;
      }
    }
  });
  return diffStr;
};

module.exports = slackDiff;
