import * as https from 'https';

export class HttpsHelper
{
    public static Get(url: URL): Promise<IAsyncHttpsResponse>
    {
        return HttpsHelper.AsyncHttpsRequest({
            hostname: url.hostname,
            port: url.port,
            method: "GET",
            path: url.pathname + url.search
        });
    }

    public static AsyncHttpsRequest(options: https.RequestOptions, body: any = undefined): Promise<IAsyncHttpsResponse>
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
}

export interface IAsyncHttpsResponse
{
    statusCode: number | undefined,
    message: string
}