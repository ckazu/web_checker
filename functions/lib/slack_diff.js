const jsdiff = require('diff');

const slackDiff = (newStr, oldStr, mode) => {
  if(typeof newStr === 'undefined') { throw new Error('invalid newStr'); }

  if(newStr === null) { newStr = ""; }
  if(typeof oldStr === 'undefined' || oldStr === null) { oldStr = ""; }

  var diffs;
  var diffStr = '';
  switch(mode) {
    case 'chars':
      diffs = jsdiff.diffChars(oldStr, newStr);
      break;
    case 'words':
      diffs = jsdiff.diffWords(oldStr, newStr);
      break;
    case 'lines':
    default:
      diffs = jsdiff.diffLines(oldStr, newStr);
      break;
  }
  diffs.forEach( (d) => {
    if(!d.value.match((/^\n+$/))) {
      if(d.added) {
        diffStr += `+ ${d.value.trim().replace(/\n/g, '\n  ')}\n`;
      } else if (d.removed) {
        diffStr += `- ~${d.value.trim().replace(/\s*\n/g, '~\n  ~')}~\n`;
      }
    }
  });
  return diffStr;
};

module.exports = slackDiff;
