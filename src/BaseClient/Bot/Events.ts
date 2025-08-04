import ready from '../../Events/BotEvents/readyEvents/ready.js';

const spawnEvents = async () =>
 Promise.all(['./Events/Bot.js', './Events/Process.js', './Events/Rest.js'].map((p) => import(p)));

await spawnEvents();
ready();
