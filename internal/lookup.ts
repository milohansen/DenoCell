import { LruCache } from "jsr:@std/cache";

const cache = new LruCache<string, string>(1000);

export function lookup(name: string) {
  return cache.get(name);
}

export function store(name: string, value: string) {
  cache.set(name, value);
}

export function remove(name: string) {
  cache.delete(name);
}

export function rename(oldName: string, newName: string) {
  const value = cache.get(oldName);

  if (!value) {
    throw new Error(`"${oldName}" does not exist in the cache`);
  }

  cache.delete(oldName);
  cache.set(newName, value);
}

store("sample", "01J7Y5HH4JW7HH1VNRCFQPSQMK");
store("server", "server");
