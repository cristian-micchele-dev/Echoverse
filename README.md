# ChatPersonajes

Aplicación full-stack para chatear e interactuar con personajes ficticios icónicos usando IA generativa. Los personajes responden en tiempo real con su propia voz, personalidad y universo — nunca rompen el personaje.

---

## Modos de juego

| Modo | Descripción |
|---|---|
| **Chat** | Conversación libre con el personaje. Sin guión, sin respuestas preparadas. |
| **Dúo** | Dos personajes interactúan entre sí ante tus preguntas. |
| **Misión** | RPG táctico con stats de vida, riesgo y sigilo. 5 turnos + desenlace. |
| **Historia** | Narrativa interactiva en primera persona. Tus decisiones cambian el rumbo. |
| **Interrogatorio** | El personaje puede mentir. Detectá las contradicciones. |
| **Batalla** | Dos personajes debaten un tema. Un juez IA elige el ganador. |
| **Combate** | Pelea uno a uno con sistema de HP y movimientos. |
| **Confesionario** | El personaje hace un análisis psicológico sin piedad de tus respuestas. |
| **Dilema** | El personaje te plantea una situación sin salida limpia. No hay respuesta correcta. |
| **Adivina el Personaje** | 4 pistas de a una. Cuanto antes lo adivinás, más puntos. |
| **Swipe** | El personaje hace una afirmación. Verdad o mentira — segundos para decidir. |
| **Este o Ese** | Elegís entre dos opciones. El personaje analiza tu personalidad. |

---

## Personajes disponibles

John Wick · Darth Vader · Sherlock Holmes · Walter White · El Profesor · Gandalf · Tony Stark · Jack Sparrow · Harry Potter · Gollum · Goku · Ragnar Lothbrok · Leonidas · Tommy Shelby · Jon Snow · Geralt de Rivia · Eleven · Lara Croft · Spider-Man · Wolverine · Terminator · Furiosa · Katniss Everdeen · y más.

---

## Stack técnico

### Backend
- **Node.js** con ES Modules
- **Express 4** — API REST + SSE streaming
- **Mistral AI** (`mistral-small-latest`) vía OpenAI SDK en modo compatibilidad
- **SSE** (Server-Sent Events) para respuestas en tiempo real
- Rate limiting: 60 req/min por IP

### Frontend
- **React 19** + **Vite**
- **React Router DOM 7** — SPA con 15+ rutas
- **Framer Motion** — animaciones
- **CSS3 puro** — sin framework, sistema de design tokens con `--char-color`

---

## Estructura del proyecto

```
chat-personajes/
├── backend/
│   ├── src/
│   │   ├── server.js              # Entry point Express
│   │   ├── routes/
│   │   │   ├── chat.js            # Todos los modos principales
│   │   │   └── interrogation.js   # Modo interrogatorio
│   │   └── data/
│   │       ├── characters.js      # System prompts de cada personaje
│   │       └── prompts.js         # Builders de prompts por modo
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx                # Router principal
    │   ├── pages/                 # Una página por modo
    │   ├── components/            # Componentes reutilizables
    │   └── data/
    │       ├── characters.js      # Metadata, colores e imágenes
    │       └── ...
    ├── public/images/             # Imágenes de personajes
    └── package.json
```

---

## Instalación y desarrollo local

### Prerequisitos
- Node.js 18+
- Cuenta en [Mistral AI](https://mistral.ai) para obtener una API key

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/chat-personajes.git
cd chat-personajes
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Editá `.env` y completá las variables:

```env
MISTRAL_API_KEY=tu_api_key_aqui
PORT=3001
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
# Backend corriendo en http://localhost:3001
```

### 3. Configurar el frontend

```bash
cd ../frontend
npm install
npm run dev
# Frontend corriendo en http://localhost:5173
```

Ambos servidores deben estar corriendo simultáneamente.

---

## Variables de entorno

El backend requiere un archivo `.env` basado en `.env.example`:

| Variable | Requerida | Descripción |
|---|---|---|
| `MISTRAL_API_KEY` | ✅ | API key de Mistral AI (proveedor principal) |
| `PORT` | ✅ | Puerto del servidor (default: 3001) |
| `FRONTEND_URL` | ✅ | URL del frontend para CORS |
| `GROQ_API_KEY` | Opcional | Alternativa de proveedor IA |
| `ELEVENLABS_API_KEY` | Opcional | Text-to-speech (no integrado actualmente) |

---

## API Reference

Todos los endpoints de chat devuelven **SSE** (`text/event-stream`). Los endpoints de configuración devuelven JSON.

### Endpoints SSE

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/chat` | Chat con personaje (soporta duoMode, battleMode, confesionarioMode) |
| `POST` | `/api/story` | Historia interactiva (5 turnos + desenlace) |
| `POST` | `/api/mission` | Misión RPG con stats y dificultad |
| `POST` | `/api/battle/verdict` | Veredicto de debate entre dos personajes |
| `POST` | `/api/confesionario/verdict` | Análisis psicológico final |
| `POST` | `/api/fight/round` | Ronda de combate |
| `POST` | `/api/dilema` | Reacción del personaje a una elección moral |
| `POST` | `/api/swipe/result` | Reacción del personaje al puntaje del juego |
| `POST` | `/api/esteoese/result` | Análisis de personalidad basado en elecciones |

### Endpoints JSON

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/characters` | Lista de personajes disponibles |
| `POST` | `/api/guess/clues` | Genera 4 pistas para adivinar un personaje |
| `POST` | `/api/guess/feedback` | Reacción del personaje a un intento de adivinanza |
| `POST` | `/api/swipe/cards` | Genera 10 afirmaciones verdad/mentira |
| `POST` | `/api/esteoese/questions` | Genera 8 pares de opciones para "Este o Ese" |
| `POST` | `/api/interrogation/start` | Inicia sesión de interrogatorio |
| `POST` | `/api/interrogation/ask` | Envía pregunta al personaje (detecta si miente) |

---

## Scripts disponibles

### Backend

```bash
npm run dev      # Desarrollo con auto-restart (node --watch)
npm run start    # Producción
npm run test     # Tests unitarios (Node test runner)
```

### Frontend

```bash
npm run dev      # Vite dev server
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # ESLint
```

---

## Deploy

### Frontend → Vercel

1. Importar el repositorio en [vercel.com](https://vercel.com)
2. Configurar **Root Directory**: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`

### Backend → Render

1. Crear un nuevo **Web Service** en [render.com](https://render.com)
2. Configurar **Root Directory**: `backend`
3. Start command: `npm run start`
4. Agregar las variables de entorno desde `.env.example`
5. Actualizar `FRONTEND_URL` con la URL de Vercel

---

## Cómo funciona el streaming

```
Usuario escribe mensaje
        │
        ▼
Frontend → POST /api/chat
        │
        ▼
Backend busca systemPrompt del personaje
        │
        ▼
Llamada a Mistral AI (stream: true)
        │
        ▼
Chunks SSE → data: {"content":"..."}\n\n
        │
        ▼
Frontend renderiza token por token
        │
        ▼
data: [DONE] → mensaje completo
```

---

## Licencia

MIT
