#!/bin/bash
cd /Users/vitorhugogomescarvalho/Ref-gio-Digital-de-Livros
killall -9 node npm 2>/dev/null
sleep 2
source ~/.nvm/nvm.sh
npm start
