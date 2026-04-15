# Reglas de Desarrollo: Frontend (React + Vite + Tailwind)

## Arquitectura de Aplicación
- Todo el estado local UI de ser posible residirá dentro del componente (`useState`).
- El estado global de la Interfaz (Ui/Theming/Tokens, Sesión de Usuario) usar **Zustand**.
- El Estado del Servidor (Server State) usar estrictamente **TanStack Query (React Query)** (`useQuery`, `useMutation`). No usar `useEffect` para cargas primarias desde la API si se pueden cachear.
- Modularizar en páginas (`/pages`), layouts (`/layouts`), componentes reusables abstractos (`/components`) y hooks custom (`/hooks`).

## Reglas de Componentes
- Crear y usar interfaces puramente Funcionales (`React.FC` ya no es recomendado por defecto en React 18, usar `function Component()`).
- Promover deconstrucción transparente de props `({ title, children }: Props)`.
- Reutilizar Iconos genéricos e implementaciones a través de `lucide-react`.

## Estilización (Tailwind CSS)
- No usar CSS en línea ni archivos CSS auxiliares por componente. Resolver estilos utilitarios directamente usando clases de Tailwind.
- Cuando una clase se ensucie demasiado (> 10 tags), refactorizar a variantes de capa CSS (ej. aplicar `@apply` en `index.css` si es un micro-componente global pre construido como un botón).
- Apoyarse fuertemente en variables semánticas configuradas en el archivo principal (como `bg-card`, `text-foreground`, `border-border`) para garantizar la compatibilidad entre Modo Oscuro (Dark Mode) y Modo Claro.

## Formularios
- En formularios robustos usar siempre **React Hook Form**.
- Validar esquemas a nivel cliente estrictamente con **Zod** y su `zodResolver`.
