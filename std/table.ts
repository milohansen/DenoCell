import {
  FilteredTable,
  FilteredTablePartition,
  Table,
  TablePartition,
} from "https://deno.land/x/azure_storage_client@0.9.0/table.ts";

import { storage } from "./storage.ts";

type AzureTable =
  | Table
  | TablePartition
  | FilteredTable
  | FilteredTablePartition;

export async function list<T>(
  table: string,
  options: {
    partitionKey?: string;
    filter?: string;
    select?: string;
    top?: number;
  } = {},
): Promise<T[]> {
  let t: AzureTable = storage.table(table);

  if (options.partitionKey) {
    t = t.partition(options.partitionKey);
  }
  if (options.filter) {
    t = t.filter(options.filter);
  }

  return (await (await t.list()).json()).value;
}

export async function getRow(
  table: string,
  partitionKey: string,
  rowKey: string,
) {
  return (await getEntity(table, partitionKey, rowKey).get()).json();
}

export async function upsertRow(
  table: string,
  partitionKey: string,
  rowKey: string,
  // TODO: allow for more types
  value: Record<string, string | number | boolean>,
) {
  return (await getEntity(table, partitionKey, rowKey).put(value)).json();
}

function getEntity(tableName: string, partitionKey: string, rowKey: string) {
  return storage.table(tableName).partition(partitionKey).entity(rowKey);
}

if (import.meta.main) {
  const listRes = await list("access");
  console.log("listRes", listRes);

  const rowRes = await getRow(
    "access",
    "1e66722f-43cd-450d-8e95-a613bddaf6a3",
    "5491ca80-b9b4-48b3-bf2d-baf05de90717",
  );
  console.log("rowRes", rowRes);
}
