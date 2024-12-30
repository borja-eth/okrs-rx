# Mi Proyecto Next.js con Supabase

Este es un proyecto Next.js que utiliza Supabase para la autenticación y gestión de datos.

## Características

- 🔐 Autenticación con Supabase
- 🎨 UI moderna con Shadcn/ui
- 🌓 Tema claro/oscuro
- 📱 Diseño responsive
- 🎯 Sidebar colapsable

## Tecnologías

- Next.js 15
- React 18
- Supabase
- TypeScript
- Tailwind CSS
- Shadcn/ui

## Inicio rápido

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env.local` con tus credenciales de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Estructura del proyecto

- `/app` - Rutas y páginas de la aplicación
- `/components` - Componentes reutilizables
- `/utils` - Utilidades y configuración de Supabase
- `/public` - Archivos estáticos

## Licencia

MIT
