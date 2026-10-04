import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const entry = path => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  build: { rolldownOptions: { input: {
    home: entry('./index.html'),
    flappy: entry('./games/flappy-three/index.html'),
    crossy: entry('./games/crossy-three/index.html'),
    lock: entry('./games/pop-the-lock/index.html'),
    claw: entry('./games/claw-machine/index.html'),
    pusher: entry('./games/coin-pusher/index.html'),
  } } },
});
