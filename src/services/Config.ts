import axios, { AxiosResponse } from "axios";

let p: Promise<unknown> | null = null;

const BASE_URL = "/config/{env}.json";
const http = axios.create();
const DEFAULT_NATIVE_CONFIG = {
  app: {
    publicURL: "https://divergentclub.ru",
    scheme: "divergent",
  },
  api: {
    http: {
      baseURL: "https://server.divergentclub.ru",
    },
    telegram: {
      twaURL: "https://t.me/divergent_app_bot/start",
    },
  },
};

function isNativeRuntime() {
  return typeof navigator !== "undefined" && navigator.product === "ReactNative";
}

function readNativeEnvConfig() {
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV || "production";
  const publicURL = process.env.EXPO_PUBLIC_APP_PUBLIC_URL || "";
  const scheme = process.env.EXPO_PUBLIC_APP_SCHEME || "";
  const twaURL = process.env.EXPO_PUBLIC_TELEGRAM_BOT_URL || "";
  const apiBaseURL = process.env.EXPO_PUBLIC_API_BASE_URL || "";

  if (appEnv !== "production" && (!apiBaseURL || !publicURL)) {
    throw new Error(`Safe configuration stop: ${appEnv} builds require EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_APP_PUBLIC_URL`);
  }

  if (!publicURL && !scheme && !twaURL && !apiBaseURL) {
    return null;
  }

  return {
    app: {
      publicURL: publicURL || DEFAULT_NATIVE_CONFIG.app.publicURL,
      scheme: scheme || DEFAULT_NATIVE_CONFIG.app.scheme,
    },
    api: {
      http: {
        baseURL: apiBaseURL || DEFAULT_NATIVE_CONFIG.api.http.baseURL,
      },
      telegram: {
        twaURL: twaURL || DEFAULT_NATIVE_CONFIG.api.telegram.twaURL,
      },
    },
  } satisfies ConfigInterface["data"];
}

function resolveRuntimeEnv() {
  if (isNativeRuntime()) {
    return process.env.NODE_ENV || "production";
  }

  if (typeof window === "undefined") {
    return process.env.NODE_ENV || "production";
  }

  const { hostname } = window.location;

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".ngrok-free.dev") ||
    hostname.endsWith(".ngrok.io")
  ) {
    return "development";
  }

  return "production";
}

interface ConfigInterface {
  data: {
    app: {
      publicURL: string;
      scheme: string;
    };
    api: {
      http: {
        baseURL: string;
      };
      telegram: {
        twaURL: string;
      };
    };
  };
  init(): Promise<unknown>;
  _loadEnv(envCurrent: string | undefined): Promise<AxiosResponse>;
}

const Config: ConfigInterface = {
  data: {
    app: {
      publicURL: "",
      scheme: "",
    },
    api: {
      http: {
        baseURL: "",
      },
      telegram: {
        twaURL: "",
      },
    },
  },
  init() {
    if (!p) {
      p = (async () => {
        if (isNativeRuntime()) {
          this.data = readNativeEnvConfig() || DEFAULT_NATIVE_CONFIG;
          return this.data;
        }

        const envResponse = await this._loadEnv(resolveRuntimeEnv());
        if (typeof envResponse.data !== "object") {
          throw new Error("Bad config file");
        }

        const nextData = envResponse.data as Partial<ConfigInterface["data"]>;
        const localApiBaseURL = import.meta.env.VITE_API_BASE_URL || "";
        const localPublicURL = import.meta.env.VITE_APP_PUBLIC_URL || "";
        const localTelegramBotURL = import.meta.env.VITE_TELEGRAM_BOT_URL || "";
        this.data = {
          app: {
            publicURL: localPublicURL || nextData.app?.publicURL || "",
            scheme: nextData.app?.scheme || "",
          },
          api: {
            http: {
              baseURL: localApiBaseURL || nextData.api?.http?.baseURL || "",
            },
            telegram: {
              twaURL: localTelegramBotURL || nextData.api?.telegram?.twaURL || "",
            },
          },
        };

        return this.data;
      })();
    }
    return p;
  },
  _loadEnv(env?: string) {
    return http.request({
      method: "get",
      url: BASE_URL.replace("{env}", env || "production"),
    });
  },
};

export default Config;
