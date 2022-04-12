import * as cron from 'cron';
import { Guilds, IGuildMinified, EAnimal } from './guilds.js';
import { HttpsHelper } from './httpsHelper.js';

class Main
{
    //Most of the code in this program is static as there isn't really a need for objects with functions on them, interfaces are good enough.
    /*This main class should only ever exist once
    and while it is unlikley it will exist more than once it is still good to enforce it being a singleton.*/
    private static _instance?: Main;

    constructor()
    {
        if (Main._instance !== undefined) { return Main._instance; }
        Main._instance = this;

        //Hourly cronjob
        new cron.CronJob('0 * * * *', Main.ProcessGuilds).start();

        //#region REMOVE IN PRODUCTION
        ////Send fops on startup.
        Main.ProcessGuilds();
        //#endregion
    }

    private static async ProcessGuilds(): Promise<void>
    {
        const guilds = await Guilds.GetGuilds();
        const animalGuilds: Map<EAnimal, IDiscordWebhookEmbed> = new Map<EAnimal, IDiscordWebhookEmbed>();
        for await (const guild of guilds)
        {
            for await (const animal of guild.animals)
            {
                if (!animalGuilds.has(animal))
                {
                    animalGuilds.set(
                        animal,
                        await Main.CreateAnimalEmbed(animal)
                    );
                }
                Main.SendWebhookMessage(guild, animalGuilds.get(animal)!);
            }
        }
    }

    private static async CreateAnimalEmbed(animalID: EAnimal): Promise<IDiscordWebhookEmbed>
    {
        var imageURL: string;
        const response = JSON.parse((await HttpsHelper.AsyncHttpsRequest({
            hostname: "api.tinyfox.dev",
            path: `/img?animal=${EAnimal[animalID].toLowerCase()}&json`,
            method: "GET"
        })).message);

        //Check if the url field is present (this is to make sure the data is valid).
        if (response.loc === undefined) { throw new Error("LOC field not found."); }

        //Get the image url.
        imageURL = "https://api.tinyfox.dev" + response.loc;

        //https://gist.github.com/thomasbnt/b6f455e2c7d743b796917fa3c205f812
        var color = 10070709;
        var name = EAnimal[animalID];
        switch (animalID)
        {
            case EAnimal.Bear: color = 6697728; break;
            case EAnimal.Bleat: color = 10053171; break;
            case EAnimal.Bun: color = 15658734; name = "Bnuuy"; break;
            case EAnimal.Capy: color = 10586239; break;
            case EAnimal.Caracal: color = 9268835; break;
            case EAnimal.Chi: color = 2105376; break;
            case EAnimal.Dog: color = 16777215; break;
            case EAnimal.Dook: color = 15658734; break;
            case EAnimal.Fox: color = 15105570; name = "Fops"; break;
            case EAnimal.Jaguar: color = 16498733; break;
            case EAnimal.Leo: color = 16766287; break;
            case EAnimal.Mane: color = 15105570; break;
            case EAnimal.Manul: color = 12434877; break;
            case EAnimal.Marten: color = 7162945; break;
            case EAnimal.Ott: color = 7162945; break;
            case EAnimal.Poss: color = 4342338; break;
            case EAnimal.Puma: color = 16766287; break;
            case EAnimal.Racc: color = 5533306; break;
            case EAnimal.Serval: color = 16766287; break;
            case EAnimal.Shiba: color = 16769154; break;
            case EAnimal.Skunk: color = 0; break;
            case EAnimal.Snek: color = 4431943; break;
            case EAnimal.Snep: color = 15658734; break;
            case EAnimal.Tig: color = 15105570; break;
            case EAnimal.Wah: color = 5570561; break;
            case EAnimal.Woof: color = 12434877; break;
            case EAnimal.Yeen: color = 16758605; break;
            case EAnimal.Yote: color = 15658734; break;
        }

        return {
            embeds:
            [
                {
                    color,
                    title: `Hourly ${name}`,
                    image: { url: imageURL },
                    footer:
                    {
                        // icon_url: "https://cdn.global-gaming.co/images/readie/fops.jpg",
                        icon_url: "https://storage.ko-fi.com/cdn/useruploads/4bc71dfa-16a8-49ca-bb1e-09864c96f750.png",
                        text: imageURL
                    }
                }
            ]
        };
    }

    private static async SendWebhookMessage(guild: IGuildMinified, embed: IDiscordWebhookEmbed): Promise<boolean>
    {
        try
        {
            const postBody = JSON.stringify(embed);
            const response = await HttpsHelper.AsyncHttpsRequest({
                hostname: "discord.com",
                path: `/api/webhooks/${guild.id}/${guild.token}`,
                method: "POST",
                headers:
                {
                    "Content-Type": "application/json",
                    "Content-Length": postBody.length
                }
            }, postBody);

            if (response.statusCode !== 204) { throw new Error(); }
            return true;
        }
        catch (err)
        {
            // console.log(`Failed to send fops to ${guild.name} (${guild.id}/${guild.channel_id})`);
            console.log(`Failed to send fops to ${guild.id}`);
            return false;
        }
    }
}
new Main();

interface IDiscordWebhookEmbed
{
    embeds:
    {
        color: number,
        title: string,
        image: { url: string },
        footer:
        {
            icon_url: string,
            text: string
        }
    }[];
}