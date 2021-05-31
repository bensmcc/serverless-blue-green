import { CodeDeploy, Lambda } from 'aws-sdk';
import { PutLifecycleEventHookExecutionStatusInput } from 'aws-sdk/clients/codedeploy';
import { InvocationRequest } from 'aws-sdk/clients/lambda';
import { version as expectedVersion } from './constants';


interface ICodeDeploymentEvent {
    DeploymentId: string;
    LifecycleEventHookExecutionId: string;
}

const codedeploy = new CodeDeploy({ apiVersion: '2014-10-06' });
const lambda = new Lambda({ apiVersion: '2015-03-31' })

export const pre = async (event: ICodeDeploymentEvent, context, callback): Promise<void> => {
    const deploymentId = event.DeploymentId;
    const lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;
    let status = 'Succeeded';

    // invoke the lambda and check for certain things. If it's what we expect, status is success.
    const invokeRequest: InvocationRequest = {
        FunctionName: process.env.HELLOFN,
        Qualifier: '$LATEST'
    }

    const lambdaResults = await lambda.invoke(invokeRequest).promise();

    // Some fake validation check things here.
    console.log('The status code is ...', lambdaResults.StatusCode);

    if (lambdaResults.StatusCode !== 200) {
        status = 'Failed';
    } else {
        console.log('The payload type is ...', typeof lambdaResults.Payload);
        console.log('The payload is ...', lambdaResults.Payload)
        const jsonPayload = JSON.parse(lambdaResults.Payload?.toString());
        console.log('The payload JSON payload is ...', jsonPayload);
        const jsonBody = JSON.parse(jsonPayload?.body);
        console.log('The json body is ...', jsonBody);
        const version = jsonBody?.version;
        console.log('The version from the body is ...', jsonBody?.version);

        if (version !== expectedVersion) {
            status = 'Failed';
        }
    }




    const params: PutLifecycleEventHookExecutionStatusInput = {
        deploymentId: deploymentId,
        lifecycleEventHookExecutionId: lifecycleEventHookExecutionId,
        status: status,
    }

    return codedeploy.putLifecycleEventHookExecutionStatus(params).promise().then(data => {
        console.log('Everything worked');
        return callback(null, 'Validation tests succeeded');

    }).catch(error => {
        console.log('Failed. Will not switch traffic', error);
        return callback(new Error('Validation tests failed'))
    });
}
export const post = async (event: ICodeDeploymentEvent, context, callback): Promise<void> => {
    const deploymentId = event.DeploymentId;
    const lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;

    // No need to do validation here since we don't really care about what happens after everything is switched over.

    const params: PutLifecycleEventHookExecutionStatusInput = {
        deploymentId: deploymentId,
        lifecycleEventHookExecutionId: lifecycleEventHookExecutionId,
        status: 'Succeeded',
    }

    return codedeploy.putLifecycleEventHookExecutionStatus(params).promise()
        .then(data => {
            console.log('Post worked');
            return callback(null, '');
        })
        .catch(() => {
            console.log('Post failed');
            return callback(new Error());
        })
}