import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.odycard.owner",
  appName: "OdyCard",
  webDir: "out",
  server: {
    // During development: Capacitor loads your Next.js dev server running on your Mac.
    // The Android emulator reaches your Mac's localhost via 10.0.2.2.
    // To test on a real device over Wi-Fi, replace with your Mac's local IP e.g. http://192.168.1.x:3000
    url: "http://10.0.2.2:3000",
    cleartext: true, // allow http (not just https) for local dev
  },
  android: {
    backgroundColor: "#000000",
  },
};

export default config;
