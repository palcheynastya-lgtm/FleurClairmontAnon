# Telegram Character Bot

Telegram-бот с анонимными сообщениями и командами персонажа.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server + Telegram bot (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `TELEGRAM_BOT_TOKEN` — токен Telegram-бота (от @BotFather)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Telegram: node-telegram-bot-api (polling mode)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/bot/index.ts` — логика бота (команды + анонимные сообщения)
- `artifacts/api-server/src/bot/phrases.ts` — фразы, сплетни и секреты персонажа

## Product

Telegram-бот с двумя режимами:
1. **Команды персонажа**: `/random` (рандомная фраза), `/gossip` (сплетня), `/tellsecret` (секрет) — выбираются случайно из списка в `phrases.ts`
2. **Анонимные сообщения**: любое текстовое сообщение боту пересылается владельцу (@MVRABLEH) анонимно

## User preferences

- Владелец бота: @MVRABLEH
- Фразы персонажа редактируются вручную в `artifacts/api-server/src/bot/phrases.ts`

## Gotchas

- Бот запускается в polling-режиме при старте сервера
- Для добавления новых фраз — редактировать `phrases.ts` и перезапустить сервер
- Анонимные сообщения пересылаются через username (@MVRABLEH), поэтому бот должен иметь общий чат с владельцем или владелец должен сначала написать боту

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
