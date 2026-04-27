import { useEffect, useState } from "react";
import { getAccessToken, refreshAccessToken } from "@/lib/api-client";

interface AuthedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export function AuthedImage({ src, ...props }: AuthedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

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
      const blob = await res.blob();
      if (revoked) return;
      url = URL.createObjectURL(blob);
      setObjectUrl(url);
    }

    load(getAccessToken());

    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (!objectUrl) return null;
  return <img src={objectUrl} {...props} />;
}
