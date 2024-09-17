import { LruCache } from "@std/cache";
import { slugify } from "@std/text/unstable-slugify";

const cache = new LruCache<string, string>(1000);

export function lookup(name: string) {
  return cache.get(slugify(name));
}

export function store(name: string, value: string) {
  const slug = slugify(name);
  if (cache.has(slug)) {
    throw new Error(`"${name}" already exists in the cache`);
  }
  cache.set(slug, value);
  saveToDisk();
}

export function remove(name: string) {
  cache.delete(slugify(name));
  saveToDisk();
}

export function rename(oldName: string, newName: string) {
  const oldSlug = slugify(oldName);
  const newSlug = slugify(newName);

  const value = cache.get(oldSlug);

  if (!value) {
    throw new Error(`"${oldName}" does not exist in the cache`);
  }

  if (cache.has(newSlug)) {
    throw new Error(`"${newName}" already exists in the cache`);
  }

  cache.set(newSlug, value);
  cache.delete(oldSlug);
  saveToDisk();
}

async function saveToDisk() {
  try {
    const data = JSON.stringify([...cache.entries()]);

    await Deno.writeTextFile("cache.json", data);
  } catch (error) {
    console.error("Failed to save cache to disk", error);
  }
}

async function loadFromDisk() {
  try {
    const data = await Deno.readTextFile("cache.json");
    const entries = JSON.parse(data) as [string, string][];

    for (const [key, value] of entries) {
      cache.set(key, value);
    }
  } catch (error) {
    console.error("Failed to load cache from disk", error);
  }
}

// store("sample", "01J7Y5HH4JW7HH1VNRCFQPSQMK");
// store("server", "01J7YK06XQEXB00WTAAGCQJSE2");
// saveToDisk();

await loadFromDisk();
console.log("Loaded cache from disk", cache.size);
