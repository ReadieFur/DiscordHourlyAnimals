import * as fs from 'fs';
import { HttpsHelper } from './httpsHelper.js';

export class Guilds
{
    public static async GetGuilds(): Promise<IGuildMinified[]>
    {
        if (!(await Guilds.GuildsFileExists())) { return []; }
        const guilds = JSON.parse(await fs.readFileSync('./guilds.json', 'utf8'));
        if (!(guilds instanceof Array)) { throw new Error('Guilds file is invalid.'); }
        for (const guild of guilds)
        {
            if (
                typeof guild.id !== "string" ||
                typeof guild.token !== "string" ||
                guild.animals === undefined ||
                !(guild.animals instanceof Array)
            ) { throw new Error('Guilds file is invalid.'); }
        }
        return guilds;
    }

    public static async GuildURLToObject(guildURL: URL): Promise<IGuild>
    {
        const responseJSON = JSON.parse((await HttpsHelper.Get(guildURL)).message);
        if (responseJSON.id === undefined) { throw new Error('Failed to get guild.'); }
        return { ...responseJSON, animals: [] };
    }

    public static async AddGuild(guild: IGuildMinified): Promise<boolean>
    {
        const guilds = await Guilds.GuildsFileExists() ? await Guilds.GetGuilds() : [];
        if (guilds.includes(guild)) { return false; }
        guilds.push(guild);
        await Guilds.SaveGuilds(guilds);
        return true;
    }

    private static SaveGuilds(guilds: IGuildMinified[]): Promise<void>
    {
        return new Promise((resolve, reject) =>
        {
            //We need to convert the guilds passed in to the minified version becuase IGuild is still valid as it extends IGuildMinified.
            var guildsMinified: IGuildMinified[] = [];
            for (const guild of guilds)
            {
                guildsMinified.push({
                    id: guild.id,
                    token: guild.token,
                    animals: guild.animals
                });
            }

            fs.writeFile(
                './guilds.json',
                JSON.stringify(guildsMinified),
                (err) =>
                {
                    if (err) { reject(err); }
                    resolve();
                }
            );
        });
    }

    private static GuildsFileExists(): Promise<boolean>
    {
        return new Promise((resolve, reject) =>
        {
            if (fs.existsSync('./guilds.json'))
            {
                resolve(true);
            }
            else
            {
                fs.writeFile('./guilds.json', '[]', (err) =>
                {
                    if (err) { reject(err); }
                    resolve(false);
                });
            }
        });
    }
}

export interface IGuildMinified
{
    id: string;
    token: string;
    animals: EAnimal[];
}

export interface IGuild extends IGuildMinified
{
    type: number;
    name: string;
    avatar: string;
    channel_id: string;
    guild_id: string;
    application_id?: string;
}

export enum EAnimal
{
    Fox,
    Yeen,
    Dog,
    Manul,
    Snek,
    Poss,
    Leo,
    Serval,
    Bleat,
    Shiba,
    Racc,
    Dook,
    Ott,
    Snep,
    Woof,
    Chi,
    Capy,
    Bear,
    Bun,
    Caracal,
    Puma,
    Mane,
    Marten,
    Tig,
    Wah,
    Skunk,
    Jaguar,
    Yote
}