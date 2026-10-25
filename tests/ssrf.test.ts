import { describe, it, expect } from "vitest";
import { isPrivateIp, validateSafeUrl } from "@/lib/ssrf";

describe("SSRF Protection & IP Validation", () => {
  it("should block loopback IPv4 addresses", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("127.1.2.3")).toBe(true);
  });

  it("should block loopback IPv6 addresses", () => {
    expect(isPrivateIp("::1")).toBe(true);
  });

  it("should block RFC1918 private IPv4 ranges", () => {
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("10.254.254.254")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.31.255.255")).toBe(true);
    expect(isPrivateIp("192.168.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.100")).toBe(true);
  });

  it("should block Cloud instance metadata address 169.254.169.254", () => {
    expect(isPrivateIp("169.254.169.254")).toBe(true);
    expect(isPrivateIp("169.254.1.1")).toBe(true);
  });

  it("should allow legitimate public IP addresses", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("140.82.121.4")).toBe(false); // GitHub
  });

  it("should reject unsafe URL schemes", async () => {
    const fileResult = await validateSafeUrl("file:///etc/passwd");
    expect(fileResult.safe).toBe(false);

    const ftpResult = await validateSafeUrl("ftp://evil.com");
    expect(ftpResult.safe).toBe(false);

    const jsResult = await validateSafeUrl("javascript:alert(1)");
    expect(jsResult.safe).toBe(false);
  });

  it("should reject localhost URLs", async () => {
    const res = await validateSafeUrl("http://localhost:3000/api/secret");
    expect(res.safe).toBe(false);
  });

  it("should reject AWS/GCP cloud metadata IP literals", async () => {
    const res = await validateSafeUrl("http://169.254.169.254/latest/meta-data");
    expect(res.safe).toBe(false);
  });
});

