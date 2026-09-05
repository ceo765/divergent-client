// Веб-шим для expo-video: нативный модуль не бандлится под web (JSX в .js ломает rollup).
// На вебе плеер - заглушка, а VideoView ничего не рисует (под ним всегда есть постер-Image).
// Алиас подключён в vite.config.ts только для web; нативная сборка (Metro) использует реальный expo-video.

export function useVideoPlayer(_source?: unknown, setup?: (player: VideoPlayerStub) => void): VideoPlayerStub {
  const player: VideoPlayerStub = {
    loop: false,
    muted: false,
    play() {},
    pause() {},
    replace() {},
    release() {},
  };
  try {
    setup?.(player);
  } catch {
    /* на вебе настройка плеера не нужна */
  }
  return player;
}

export function VideoView(_props: Record<string, unknown>): null {
  return null;
}

export interface VideoPlayerStub {
  loop: boolean;
  muted: boolean;
  play(): void;
  pause(): void;
  replace(source?: unknown): void;
  release(): void;
}
