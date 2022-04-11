//Imports.
import * as fs from "fs";
import * as https from "https";
import * as cron from "cron";

class HourlyFops
{
    private initailized: boolean = false;
    private guilds: IGuild[] = [];

    constructor() {}

    public async AsyncInit(): Promise<void>
    {
        if (this.initailized) { return; }

        //Check that the guilds.json file exists and is valid.
        if (!fs.existsSync("guilds.json"))
        {
            console.log("guilds.json not found");
            process.exit(1);
        }
        var guildsJson: string[];
        try
        {
            guildsJson = JSON.parse(fs.readFileSync("guilds.json", "utf8"));
        }
        catch (err)
        {
            console.log("Invalid guilds.json");
            process.exit(1);
        }

        //Parse the guilds.
        for (const guild of guildsJson)
        {
            try
            {
                //Create a GET request to the guild"s webhook to get the webhook data.
                const response = await HourlyFops.AsyncHttpsRequest(new URL(guild));

                //Parse the webhook data.
                const webhookData = JSON.parse(response.message);

                //Check if the id field is present (this is to make sure the data is valid).
                if (webhookData.id === undefined) { throw new Error("id field not found"); }

                //Add the guild to the list of parsed guilds.
                this.guilds.push(webhookData as IGuild);
            }
            catch (err)
            {
                //If the data is invalid, log the error and continue.
                console.log(`Invalid webhook data for ${guild}`);
                continue;
            }
        }

        //Log to Pterodactyl that the program has loaded.
        console.log("[Pterodactyl] Ready");

        //Create a cron job to run hourly.
        new cron.CronJob("0 * * * *", this.SendFops).start();

        //Set the initailized flag to true.
        this.initailized = true;

        //#region REMOVE IN PRODUCTION
        ////Send fops on startup.
        // this.SendFops();
        //#endregion
    }

    public static AsyncHttpsRequest(options: https.RequestOptions | URL, body: any = undefined): Promise<IAsyncHttpsResponse>
    {
        return new Promise<IAsyncHttpsResponse>((resolve, reject) =>
        {
            const request = https.request(options, (res) =>
            {
                var message = "";
                res.on("data", (chunk) =>
                {
                    message += chunk;
                });
                res.on("end", () =>
                {
                    resolve({
                        statusCode: res.statusCode,
                        message: message
                    });
                });
            });
            request.on("error", (err) =>
            {
                reject(err);
            });
            if (body !== undefined) { request.write(body); }
            request.end();
        });
    }

    private async SendFops(): Promise<void>
    {
        const guilds = this.guilds;
        const startTime = Date.now();
        if (guilds.length === 0) { return; }

        console.log(`Getting fops for ${guilds.length}, start time: ${startTime}...`);

        var imageURL: ITinyFoxResponse["loc"] | undefined;
        try
        {
            //Get an image from tinyfox.dev.
            const response = await HourlyFops.AsyncHttpsRequest({
                hostname: "api.tinyfox.dev",
                path: "/img?animal=fox&json",
                method: "GET"
            });

            //Parse the image data.
            const imageData = JSON.parse(response.message);

            //Check if the url field is present (this is to make sure the data is valid).
            if (imageData.loc === undefined) { throw new Error("url field not found"); }

            //Get the image url.
            imageURL = "https://api.tinyfox.dev" + imageData.loc;
        }
        catch (err)
        {
            //If the data is invalid, log the error and continue.
            console.log(`Failed to get image.`);
            return;
        }

        //If the previous code block was successful, prepare the POST json data.
        //https://discord.com/developers/docs/resources/webhook#execute-webhook
        //I am trying to replicate the layout of the Telegram bot.
        const postData = JSON.stringify(
        {
            embeds:
            [
                {
                    color: 15105570, //Orange (for fox)
                    title: "Hourly Fops",
                    image: { url: imageURL },
                    footer:
                    {
                        icon_url: "https://cdn.global-gaming.co/images/readie/fops.jpg",
                        text: imageURL
                    }
                }
            ]
        });

        //Now send the post to each guild.
        console.log("Sending fops...");
        var guildsProcessed = 0;
        //Asynchronous:
        for (const guild of guilds)
        {
            try
            {
                HourlyFops.AsyncHttpsRequest({
                    hostname: "discord.com",
                    path: `/api/webhooks/${guild.id}/${guild.token}`,
                    method: "POST",
                    headers:
                    {
                        "Content-Type": "application/json",
                        "Content-Length": postData.length
                    }
                }, postData).then((response) =>
                {
                    if (response.statusCode !== 204) { console.log(`Failed to send fops to ${guild.name} (${guild.id}/${guild.channel_id})`); }
                    guildsProcessed++;
                });
            }
            catch (err)
            {
                console.log(`Failed to send fops to ${guild.name} (${guild.id}/${guild.channel_id})`);
                guildsProcessed++;
            }
        }

        //Syncronous:
        /*var successfulGuilds: IGuild[] = [];
        var failedGuilds: IGuild[] = [];
        for (const guild of guilds)
        {
            //POST to each guild.
            try
            {
                const response = await HourlyFops.AsyncHttpsRequest({
                    hostname: "discord.com",
                    path: `/api/webhooks/${guild.id}/${guild.token}`,
                    method: "POST",
                    headers:
                    {
                        "Content-Type": "application/json",
                        "Content-Length": postData.length
                    }
                }, postData);

                if (response.statusCode === 204) { successfulGuilds.push(guild); }
                else { failedGuilds.push(guild); }
            }
            catch (err) { failedGuilds.push(guild); }
        }

        //Log the results.
        if (failedGuilds.length === 0 && successfulGuilds.length > 0) { console.log("Sent fops to all guilds."); }
        else if (failedGuilds.length > 0 && successfulGuilds.length === 0) { console.log("Failed to send fops to all guilds."); }
        else
        {
            console.log(`Successfully sent fops to ${successfulGuilds.length} guilds:`);
            for (const guild of successfulGuilds) { console.log(`${guild.name} (${guild.id}/${guild.channel_id}`); }

            console.log(`Failed to send fops to ${failedGuilds.length} guilds:`);
            for (const guild of failedGuilds) { console.log(`${guild.name} (${guild.id}/${guild.channel_id}`); }
        }*/

        new Promise<void>(async () =>
        {
            //Wait for all guilds to be processed.
            while (guildsProcessed !== guilds.length) { await new Promise(resolve => setTimeout(resolve, 1000)); }
            const now = Date.now();
            console.log(`Processed fops for all ${guilds.length} guilds. Started at ${startTime}, ended at ${now}, took ${now - startTime}ms.`);
        });
    }
}
new HourlyFops().AsyncInit();

interface IAsyncHttpsResponse
{
    statusCode: number | undefined,
    message: string
}

interface IGuild
{
    type: number;
    id: string;
    name: string;
    avatar: string;
    channel_id: string;
    guild_id: string;
    application_id?: string;
    token: string;
}

interface ITinyFoxResponse
{
    loc: string;
    remaining_api_calls: string;
}