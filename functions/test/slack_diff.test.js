const slackDiff = require('../lib/slack_diff');

test('slackDiff', () => {
  expect(slackDiff('new text', 'old text')).toBe('- ~old text~\n+ new text\n');
  expect(slackDiff('new text')).toBe('+ new text\n');
  expect(slackDiff('new text', null)).toBe('+ new text\n');
  expect(slackDiff(null, 'old text')).toBe('- ~old text~\n');

  expect(slackDiff('new text\nsecond line', 'old text\nsecond line')).toBe('- ~old text~\n+ new text\n');
  expect(slackDiff('new text\nnew second line', 'old text\nold second line')).toBe('- ~old text~\n  ~old second line~\n+ new text\n  new second line\n');
  expect(slackDiff('new text\nnew second line', 'old text \nold second line')).toBe('- ~old text~\n  ~old second line~\n+ new text\n  new second line\n');
});

test('differ without newStr', () => {
  withoutArgs = () => slackDiff();
  expect(withoutArgs).toThrowError('invalid newStr');
});
