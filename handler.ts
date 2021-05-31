import { APIGatewayProxyHandler } from "aws-lambda"
import { statusCodes, version } from './constants';

export const hello: APIGatewayProxyHandler = async (event) => {
    const randomCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];

    return {
        statusCode: randomCode,
        body: JSON.stringify({
            version: version,
            code: randomCode
        })
    }
}