const slackDiff = require('../lib/slack_diff');

test('slackDiff', () => {
  expect(slackDiff('new text', 'old text')).toBe('- ~old text~\n+ new text\n');
  expect(slackDiff('new text')).toBe('+ new text\n');
  expect(slackDiff('new text', null)).toBe('+ new text\n');
  expect(slackDiff(null, 'old text')).toBe('- ~old text~\n');
});

test('differ without newStr', () => {
  withoutArgs = () => slackDiff();
  expect(withoutArgs).toThrowError('invalid newStr');
});
