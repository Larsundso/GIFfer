export default (message: string) => {
 if (!process.argv.includes('--debug')) return;

 // eslint-disable-next-line no-console
 console.log(message);
};
