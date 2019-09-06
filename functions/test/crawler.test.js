const crawler = require('../lib/crawler');

// todo: mock
test('crawler', async () => {
  await expect(crawler('https://www.google.com/?hl=ja', 'title')).resolves.toBe('Google');
  await expect(crawler('https://www.google.com/?hl=ja')).resolves.toMatch(/Gmail.*Google/);
  await expect(crawler('https://www.google.com/?hl=ja', null)).resolves.toMatch(/Gmail.*Google/);
});

test('throw error invalidURI', async () => {
  await expect(crawler()).rejects.toThrowError('invalid URI');
  await expect(crawler(null)).rejects.toThrowError('invalid URI');
});

test('throw error when http access is failed', async () => {
  await expect(crawler('http://un-exsistance.uri')).rejects.toThrowError(/getaddrinfo ENOTFOUND/);
});
