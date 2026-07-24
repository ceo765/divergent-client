import { useFonts } from "expo-font";

import { NativeRuntimeRoot } from "@/app/native/NativeRuntimeRoot";

export default function NativeAppRoot() {
  const [fontsLoaded] = useFonts({
    // Metro requires a static CommonJS asset reference here.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Montserrat: require("@/assets/fonts/Montserrat-VariableFont_wght.ttf"),
  });

  return <NativeRuntimeRoot mode="standalone" ready={fontsLoaded} />;
}
