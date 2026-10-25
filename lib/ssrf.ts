import dns from "node:dns";
import net from "node:net";

/**
 * Checks whether an IP address is private, loopback, link-local, or cloud metadata.
 */
export function isPrivateIp(ip: string): boolean {
  if (!net.isIP(ip)) {
    return true; // Invalid IP is treated as unsafe
  }

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [b0, b1] = parts;

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return true;

    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true;

    // 10.0.0.0/8 (Private)
    if (b0 === 10) return true;

    // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (b0 === 192 && b1 === 168) return true;

    // 169.254.0.0/16 (Link-local / AWS/GCP/Azure instance metadata)
    if (b0 === 169 && b1 === 254) return true;

    // 100.64.0.0/10 (Carrier-grade NAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

    // 224.0.0.0/4 (Multicast)
    if (b0 >= 224 && b0 <= 239) return true;

    // 240.0.0.0/4 (Reserved)
    if (b0 >= 240) return true;

    // 255.255.255.255 (Broadcast)
    if (ip === "255.255.255.255") return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // Loopback ::1
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
    // Unspecified ::
    if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;
    // Unique local address fc00::/7 (fc00:: - fdff::)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    // Link-local unicast fe80::/10
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
    // IPv4-mapped IPv6 ::ffff:127.0.0.1
    if (normalized.startsWith("::ffff:")) {
      const ipv4Part = normalized.substring(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateIp(ipv4Part);
      }
    }
  }

  return false;
}

/**
 * Validates a target URL against SSRF attacks.
 * Verifies scheme is http/https and resolves hostname to ensure it does not point to internal/private IPs.
 */
export async function validateSafeUrl(rawUrl: string): Promise<{ safe: boolean; reason?: string; url?: URL }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "Invalid URL structure" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: "Unsupported protocol. Only http: and https: are allowed." };
  }

  const hostname = parsed.hostname;

  // Block obvious localhost names
  if (hostname.toLowerCase() === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { safe: false, reason: "Host refers to an internal network" };
  }

  // If hostname is directly an IP literal
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { safe: false, reason: "IP address is private or reserved" };
    }
    return { safe: true, url: parsed };
  }

  // Resolve hostname via DNS
  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    for (const record of lookupResult) {
      if (isPrivateIp(record.address)) {
        return { safe: false, reason: `Resolved IP ${record.address} is private or reserved` };
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DNS resolution failure";
    return { safe: false, reason: `Cannot resolve domain: ${msg}` };
  }

  return { safe: true, url: parsed };
}

/**
 * Safe fetcher that enforces timeout, max size limit (512 KB), and manual redirect validation
 * to prevent SSRF bypass via HTTP 301/302 redirects to private/internal networks or cloud metadata.
 */
export async function safeFetchHtml(rawUrl: string, timeoutMs = 4000, maxBytes = 512 * 1024): Promise<string | null> {
  let currentUrl = rawUrl;
  const maxRedirects = 3;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const check = await validateSafeUrl(currentUrl);
    if (!check.safe || !check.url) {
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(check.url.href, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 LinkStack/1.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "manual",
      });

      // Handle HTTP redirects (301, 302, 303, 307, 308)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || hop === maxRedirects) {
          return null;
        }

        // Resolve relative redirect against current URL
        try {
          const resolved = new URL(location, check.url.href);
          currentUrl = resolved.href;
          continue;
        } catch {
          return null;
        }
      }

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
        return null;
      }

      // Read response up to maxBytes
      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        return text.slice(0, maxBytes);
      }

      let received = 0;
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        chunks.push(value);
        received += value.length;
        if (received >= maxBytes) {
          await reader.cancel();
          break;
        }
      }

      const totalBuffer = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        totalBuffer.set(chunk.slice(0, Math.min(chunk.length, received - offset)), offset);
        offset += chunk.length;
        if (offset >= received) break;
      }

      return new TextDecoder("utf-8").decode(totalBuffer);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}
