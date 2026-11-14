#!/bin/sh
# Gera as imagens de prévia de link a partir de scripts/og.html e scripts/icon.html.
# Uso: pnpm og   (precisa do Google Chrome instalado)
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
shot() { # arquivo.html largura altura saida.png
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --virtual-time-budget=3000 --window-size="$2,$3" --screenshot="$PWD/$4" "file://$PWD/scripts/$1" >/dev/null 2>&1
}
shot og.html 1200 630 public/og.png
shot icon.html 180 180 public/apple-touch-icon.png
echo "ok: public/og.png e public/apple-touch-icon.png"
