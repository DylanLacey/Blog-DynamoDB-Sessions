import { Entity, EntityItem } from "dynamodb-toolbox";
import { MarukiTable } from "../data/objects";
import { ulid } from "ulid";
import bcrypt from "bcryptjs"
import {Config} from "@serverless-stack/node/config"

export const User = new Entity ({
  name: "User",
  timestamps: true,
  attributes: {
    pk: { partitionKey: true, prefix: "User|" },
    sk: { sortKey: true, default: "UserDetails", hidden: true },
    username: "string",
    displayName: "string",
    salt: { 
              default: (() => {ulid()})
    },
    hashedPw: "string",
    apiKey: {
              default: (() => {ulid()})
    },
    gsi1pk: { 
              dependsOn: "username",
              hidden: false,
              prefix: "Username|",
              default: (data: {username: string; }) => 
                {return `${data.username}`} },
    gsi1sk: { 
              dependsOn: "pk",
              default: (data: {pk: string; }) => 
                {return `User|${data.pk}`} },
  },

  table: MarukiTable,
});

export const UserMembership = new Entity({
  name: "UserMembership",
  timestamps: true,
  attributes: {
    pk: { partitionKey: true, prefix: "User|", },
    sk: { sortKey: true, prefix: "Membership_Team|" },

    //GSI1 allows retrieving all members of a team
    gsi1pk: { partitionKey: "GSI1", prefix: "Team|",
              default: (data: {sk: string; }) =>
                data.sk
            },
    gsi1sk: { sortKey: "GSI1", 
              prefix: "Members_User|", 
              default: (data: {pk: string; }) => 
                data.pk},
  },

  table: MarukiTable,
})

export const findUser = (username: string) =>  {
  return User.query(`Username|${username}`, {index: "GSI1", attributes: ["pk", "sk", "username", "displayName"]})
}

// export const createUser = async (params: Omit<EntityItem<typeof User>, "created" | "modified" | "entity" | "pk" | "hashedPw">): Promise<Omit<EntityItem<typeof User>, "created" | "modified" | "entity">> => {
export const createUser = async (params: NewUserRequestParams): Promise<NewUserParams> => {
  let hash = await generateHashedPassword(params.desiredPassword)
  let [apiKey, hashedApiKey] = await generateAPIKey()
  const generatedUserDetails = { username: params.username, pk: ulid(), apiKey: ulid(), displayName: params.displayName }
  const userParams = {...generatedUserDetails, hashedPw: hash, apiKey: hashedApiKey };  
  await User.put(userParams);

  return {...generatedUserDetails, apiKey: apiKey};
}

const generateHashedPassword = async (suppliedPassword: string): Promise<string> => {
  let pepper = Config.SPICE
  console.log(`User Creation Pepper: ${pepper}`)
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(`${suppliedPassword}|${pepper}`, salt);

  return (hash)
}

const generateAPIKey = async(): Promise<Array<string>> => {
  let apiKey = ulid()
  let hashedKey = await generateHashedPassword(apiKey)

  return [apiKey, hashedKey]
}

interface NewUserRequestParams {
  username: string,
  displayName: string,
  desiredPassword: string,
}

interface NewUserParams extends Omit<NewUserRequestParams, "desiredPassword"> {
  pk: string,
  apiKey: string,
}