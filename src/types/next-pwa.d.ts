declare module "next-pwa" {
  type RuntimeCachingEntry = {
    urlPattern: string | RegExp;
    handler: string;
    options?: Record<string, unknown>;
  };
  type PWAOptions = {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: RuntimeCachingEntry[];
    buildExcludes?: RegExp[];
    fallbacks?: { document?: string };
  };
  export default function withPWA(options?: PWAOptions): (config: unknown) => unknown;
}
