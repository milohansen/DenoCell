import { AzureStorage } from "https://deno.land/x/azure_storage_client@0.9.0/mod.ts";
import "jsr:@std/dotenv/load";

const connectionString = Deno.env.get("STORAGE_CONNECTION_STRING") || "";
export const storage: AzureStorage = new AzureStorage(connectionString);