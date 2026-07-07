import { NextResponse } from "next/server";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

const DISPOSABLE_EMAIL_BLACKLIST = [
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "dispostable.com",
  "getairmail.com",
  "sharklasers.com",
  "maildrop.cc",
  "trashmail.com",
  "fake.com",
  "test.com",
  "example.com",
  "xyz.com"
];

const TRUSTED_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "zoho.com",
  "proton.me",
  "protonmail.com"
];

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ valid: false, message: "Invalid email format." });
    }

    const domain = email.split("@")[1]?.toLowerCase();
    
    // 1. Check blacklist
    if (DISPOSABLE_EMAIL_BLACKLIST.includes(domain)) {
      return NextResponse.json({ 
        valid: false, 
        message: "Disposable or temporary email domains are blocked for safety." 
      });
    }

    // 2. Bypass MX record check for trusted common domains
    if (TRUSTED_DOMAINS.includes(domain)) {
      return NextResponse.json({ valid: true });
    }

    // 3. Perform MX Record DNS Lookup for other domains
    try {
      const mxRecords = await resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return NextResponse.json({ 
          valid: false, 
          message: "The email domain does not have valid mail servers (MX records). Reset links cannot be delivered." 
        });
      }
    } catch (dnsErr: any) {
      const errorCode = dnsErr.code || "";
      // Only block if the domain is explicitly not found (ENOTFOUND) or has no records (ENODATA)
      if (errorCode === "ENOTFOUND" || errorCode === "ENODATA") {
        return NextResponse.json({ 
          valid: false, 
          message: "The email domain is invalid or inactive. Please use a real email address." 
        });
      }
      // If there's a timeout or network query refusal (e.g. offline dev), let it pass
      console.warn("DNS MX lookup failed with code:", errorCode);
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    return NextResponse.json({ valid: false, message: "Failed to validate email." });
  }
}
