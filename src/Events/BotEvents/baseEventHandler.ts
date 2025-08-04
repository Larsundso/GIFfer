import getEvents from '../../BaseClient/UtilModules/getEvents.js';

export default async (eventName: string, args: unknown[]) => {
 processEvents(eventName, args);
 clusterEvents(eventName, args);
 botEvents(eventName, args);
 restEvents(eventName, args);
};

const botEvents = async (eventName: string, args: unknown[]) => {
 const event = getEvents.BotEvents.find((e) => e.endsWith(`${eventName}.js`));
 if (!event) return;

 (await import(event)).default(...args);
};

const clusterEvents = async (eventName: string, args: unknown[]) => {
 const event = getEvents.ClusterEvents.find((e) => e.endsWith(`${eventName}.js`));
 if (!event) return;

 (await import(event)).default(...args);
};

const processEvents = async (eventName: string, args: unknown[]) => {
 const event = getEvents.ProcessEvents.find((e) => e.endsWith(`${eventName}.js`));
 if (!event) return;

 (await import(event)).default(...args);
};

const restEvents = async (eventName: string, args: unknown[]) => {
 const event = getEvents.RestEvents.find((e) => e.endsWith(`${eventName}.js`));
 if (!event) return;

 (await import(event)).default(...args);
};
