const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// react-native-health не подхватывается автолинковкой (нестандартное имя
// podspec RNAppleHealthKit, нет react-native.config.js в пакете). Вписываем
// pod в Podfile напрямую - детерминированно, на этапе prebuild.
module.exports = function withHealthKitPod(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");
      if (!contents.includes("RNAppleHealthKit")) {
        const podLine =
          "  pod 'RNAppleHealthKit', :path => '../node_modules/react-native-health'\n";
        contents = contents.replace(
          /(config = use_native_modules!\(config_command\)\n)/,
          `$1${podLine}`
        );
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);
};
