import { APIGatewayProxyHandler } from "aws-lambda"
import { version } from './constants';

export const hello: APIGatewayProxyHandler = async (event) => {
    const possibleCodes = [200, 500];
    const randomCode = possibleCodes[Math.floor(Math.random() * possibleCodes.length)];

    return {
        statusCode: randomCode,
        body: JSON.stringify({
            version: version
        })
    }
}