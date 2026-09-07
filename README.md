# 🏛️ Presidente Online — Simulador de Geopolítica Multiplayer

Jogo de estratégia geopolítica **online e multiplayer** no navegador, inspirado no gênero
dos simuladores de presidente (estilo Modern Age). Código 100% original, servidor Node.js
sem dependências (WebSocket artesanal).

## Jogar
1. Abra o site e digite seu nome → **Criar sala**
2. Compartilhe o **código de 4 letras** ou o **link de convite** (`/?sala=XXXX`)
3. Até 12 jogadores escolhem nações e o anfitrião inicia

## Mecânicas
- Turnos de 45s com calendário (início 01-07-2024), 4 pontos de ação/turno
- Economia, recrutamento, propaganda, aprovação popular (≤5% = deposto)
- 🗺️ Mapa-múndi interativo com 12 nações e 3 províncias reais por país
- 🏗️ Infraestrutura por província (rende $/turno) e 🏴 ocupação territorial em guerras
- ⚔️ Ataques convencionais com saque · ☢️ Programa nuclear (níveis 0–5) e lançamento de míssil
- 🤝 Alianças · 🚫 Sanções econômicas · 🧨 Sabotagem · 🕵️ Espionagem
- 🎲 Eventos aleatórios · 💬 Chat de diplomacia
- 🏆 5 vitórias: conquista, econômica, ideológica, religiosa ou última nação de pé

## Rodar localmente
```bash
npm start   # ou: node server.js  (porta 3000 por padrão, honra $PORT)
```

## Deploy (Render)
Serviço Node web; build `npm install`, start `npm start`, health check `/health`.
