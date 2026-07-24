type NativeConfigData = {
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

let p: Promise<unknown> | null = null;

const DEFAULT_NATIVE_CONFIG: NativeConfigData = {
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

const Config = {
  data: {
    app: {
      publicURL: "",
      scheme: DEFAULT_NATIVE_CONFIG.app.scheme,
    },
    api: {
      http: {
        baseURL: "",
      },
      telegram: {
        twaURL: "",
      },
    },
  } satisfies NativeConfigData,
  init() {
    if (!p) {
      p = new Promise((resolve) => {
        const appEnv = process.env.EXPO_PUBLIC_APP_ENV || "production";
        const configuredBaseURL = process.env.EXPO_PUBLIC_API_BASE_URL || "";
        const configuredPublicURL = process.env.EXPO_PUBLIC_APP_PUBLIC_URL || "";
        if (appEnv !== "production" && (!configuredBaseURL || !configuredPublicURL)) {
          throw new Error(`Safe configuration stop: ${appEnv} builds require EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_APP_PUBLIC_URL`);
        }
        const baseURL = configuredBaseURL || DEFAULT_NATIVE_CONFIG.api.http.baseURL;
        const publicURL = configuredPublicURL || DEFAULT_NATIVE_CONFIG.app.publicURL;
        const scheme = process.env.EXPO_PUBLIC_APP_SCHEME || DEFAULT_NATIVE_CONFIG.app.scheme;

        this.data = {
          app: {
            publicURL,
            scheme,
          },
          api: {
            http: {
              baseURL,
            },
            telegram: {
              twaURL: process.env.EXPO_PUBLIC_TELEGRAM_BOT_URL || DEFAULT_NATIVE_CONFIG.api.telegram.twaURL,
            },
          },
        };

        resolve(this.data);
      });
    }

    return p;
  },
};

export default Config;
