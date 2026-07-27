import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default {
  dependencies: {
    "react-native-health": {
      root: path.join(dir, "node_modules/react-native-health"),
      platforms: {
        ios: {
          podspecPath: path.join(dir, "node_modules/react-native-health/RNAppleHealthKit.podspec"),
        },
        android: null,
      },
    },
  },
};
