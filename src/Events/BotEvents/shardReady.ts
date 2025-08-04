export default async (id: number, unavailableGuilds?: Set<string>) => {
 // eslint-disable-next-line no-console
 console.log(`[Shard ${id + 1}] Ready - Unavailable Guilds: ${unavailableGuilds?.size ?? '0'}`);
};
