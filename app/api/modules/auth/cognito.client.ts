import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

export const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env["AWS_REGION"] ?? "eu-west-2",
});

export const COGNITO_USER_POOL_ID = process.env["COGNITO_USER_POOL_ID"]!;
export const COGNITO_CLIENT_ID = process.env["COGNITO_CLIENT_ID"]!;
