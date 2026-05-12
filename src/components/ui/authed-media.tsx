import { useEffect, useState } from "react";
import { getAccessToken, refreshAccessToken } from "@/lib/api-client";

type ProgressMediaType = "image" | "video";

interface AuthedMediaProps {
  src: string;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
  mediaType?: ProgressMediaType;
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  webm: "video/webm",
  ogv: "video/ogg",
  ogg: "video/ogg",
};

function mimeFromSrc(src: string): string | null {
  const ext = src.match(/\.([a-z0-9]+)(?:$|[?#&])/i)?.[1]?.toLowerCase();
  return ext ? (EXT_TO_MIME[ext] ?? null) : null;
}

function inferMediaType(src: string, mimeType?: string | null): ProgressMediaType {
  if (mimeType?.startsWith("video/")) return "video";
  if (/\.(mp4|m4v|mov|webm|ogv|ogg)(?:$|[?#&])/i.test(src)) return "video";
  return "image";
}

export function AuthedMedia({ src, alt, className, loading, mediaType }: AuthedMediaProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let url: string | null = null;

    async function load(token: string | null) {
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      let res = await fetch(src, { headers, credentials: "include" });
      if (res.status === 401) {
        const fresh = await refreshAccessToken();
        if (!fresh) return;
        res = await fetch(src, {
          headers: { Authorization: `Bearer ${fresh}` },
          credentials: "include",
        });
      }
      if (!res.ok || revoked) return;
      const headerType = res.headers.get("Content-Type");
      const rawBlob = await res.blob();
      if (revoked) return;
      const srcMime = mimeFromSrc(src);
      const candidateType = rawBlob.type || headerType || "";
      const isGenericType =
        !candidateType ||
        candidateType === "application/octet-stream" ||
        candidateType === "binary/octet-stream";
      const resolvedType = isGenericType ? (srcMime ?? candidateType) : candidateType;
      const typedBlob =
        rawBlob.type && rawBlob.type === resolvedType
          ? rawBlob
          : new Blob([rawBlob], { type: resolvedType });
      url = URL.createObjectURL(typedBlob);
      setMimeType(resolvedType || null);
      setObjectUrl(url);
    }

    load(getAccessToken());

    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (!objectUrl) return null;

  const resolvedMediaType = mediaType ?? inferMediaType(src, mimeType);
  if (resolvedMediaType === "video") {
    return (
      <video
        src={objectUrl}
        className={className}
        controls
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    );
  }

  return <img src={objectUrl} alt={alt ?? ""} className={className} loading={loading} />;
}
