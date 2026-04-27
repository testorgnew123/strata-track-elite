import { getStore } from "@netlify/blobs";

type StoreKind = "photos" | "documents" | "avatars";

const STORE_NAMES: Record<StoreKind, string> = {
  photos: "progress-photos",
  documents: "project-documents",
  avatars: "avatars",
};

export function blobStore(kind: StoreKind) {
  return getStore(STORE_NAMES[kind]);
}

export async function putBlob(
  kind: StoreKind,
  key: string,
  body: Uint8Array | ArrayBuffer | string,
  metadata?: Record<string, string | number>,
): Promise<void> {
  const store = blobStore(kind);
  await store.set(key, body as never, { metadata });
}

export async function getSignedDownloadUrl(
  kind: StoreKind,
  key: string,
  ttlSeconds = 300,
): Promise<string> {
  const store = blobStore(kind);
  // Netlify Blobs signed URL — falls back to a relative API path if signing not available.
  const anyStore = store as unknown as {
    getSignedURL?: (k: string, opts?: { ttlSeconds?: number }) => Promise<string>;
  };
  if (typeof anyStore.getSignedURL === "function") {
    return anyStore.getSignedURL(key, { ttlSeconds });
  }
  return `/api/blob?store=${encodeURIComponent(STORE_NAMES[kind])}&key=${encodeURIComponent(key)}`;
}

export async function getBlobBytes(kind: StoreKind, key: string): Promise<ArrayBuffer | null> {
  const store = blobStore(kind);
  const data = await store.get(key, { type: "arrayBuffer" });
  return (data as ArrayBuffer) ?? null;
}
