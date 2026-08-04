# Robert's Drivers — Handoff a Claude Code

Este proyecto se construyó hasta ahora en el chat de Claude.ai. Esta carpeta es
el código completo, listo para seguir trabajando en **Claude Code** con git de verdad.

## 1. Instala Claude Code (si no lo tienes)
```
npm install -g @anthropic-ai/claude-code
```
Más detalles: https://docs.claude.com/claude-code

## 2. Abre este proyecto
```
cd robert-drivers-app
claude
```
Eso abre una sesión de Claude Code directo en esta carpeta. Puedes pedirle que
lea `CONTEXTO.md` primero para que entienda todo lo avanzado sin que tengas
que explicar de nuevo.

## 3. Conéctalo a git (recomendado)
```
git init
git add .
git commit -m "Estado inicial desde Claude.ai"
```
Luego crea un repositorio vacío en GitHub y:
```
git remote add origin <URL-de-tu-repo>
git push -u origin main
```
`.env.local` está en `.gitignore` a propósito — nunca se sube al repo.

## 4. Conecta Vercel por Git (para que cada push despliegue solo)
1. En vercel.com → **Add New → Project → Import Git Repository** → elige tu repo.
2. En **Environment Variables**, agrega las mismas dos que están en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. Desde ahí, cada `git push` a `main` despliega automático — ya no
   hace falta que nadie pegue archivos a mano.

## 5. Instalar dependencias y probar local
```
npm install
npm run dev
```

## Qué hay en esta carpeta
- `CONTEXTO.md` — resumen de en qué fase va el proyecto y qué falta (dáselo a Claude Code de entrada)
- `supabase/schema.sql` — el esquema completo ya corrido en tu Supabase real
- El resto es el código de la app (Next.js + Supabase), ya desplegado y funcionando en
  https://robert-drivers-app.vercel.app
