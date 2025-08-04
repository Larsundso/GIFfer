import constants from '../Other/constants.js';
import arrayBufferToBuffer from '../UtilModules/arrayBufferToBuffer.js';
import fileURL2Buffer from '../UtilModules/fileURL2Buffer.js';
import getAllJobs from '../UtilModules/getAllJobs.js';
import getEvents from '../UtilModules/getEvents.js';
import getNameAndFileType from '../UtilModules/getNameAndFileType.js';
import getPathFromError from '../UtilModules/getPathFromError.js';
import getRandom from '../UtilModules/getRandom.js';
import sleep from '../UtilModules/sleep.js';
import * as utils from '../UtilModules/util.js';

interface Util {
 getPathFromError: typeof getPathFromError;
 getAllJobs: typeof getAllJobs;
 arrayBufferToBuffer: typeof arrayBufferToBuffer;
 constants: typeof constants;
 fileURL2Buffer: typeof fileURL2Buffer;
 getEvents: typeof getEvents;
 getNameAndFileType: typeof getNameAndFileType;
 getRandom: typeof getRandom;
 sleep: typeof sleep;
 util: typeof utils;
}

const util: Util = {
 getPathFromError,
 getAllJobs,
 arrayBufferToBuffer,
 constants,
 fileURL2Buffer,
 getEvents,
 getNameAndFileType,
 getRandom,
 sleep,
 util: utils,
};

export default util;
