import {
  AdminSummary,
  DayPause,
  HistoryDay,
  NotificationItem,
  Preferences,
  Routine,
  SessionUser,
  WorkerTrack,
} from './models';

export const DEMO_USERS: Array<SessionUser & { password: string }> = [
  {
    id: 101,
    name: 'Sharit Cardona',
    email: 'sharit@uniempresarial.edu.co',
    password: 'Sharit1',
    role: 'trabajador',
    area: 'Administrativa',
    jornada: '8:00 a.m. – 5:00 p.m.',
    avatar: 'sharit',
    demo: true,
  },
  {
    id: 1,
    name: 'Admin Pausas Activas',
    email: 'admin@pausas.com',
    password: 'admin123',
    role: 'administrador',
    area: 'Talento Humano',
    jornada: '8:00 a.m. – 5:00 p.m.',
    avatar: 'admin',
    demo: true,
  },
];

export const DEFAULT_PREFERENCES: Preferences = {
  notifications: true,
  dnd: false,
  reminders: true,
  visualRest: true,
};

export const INITIAL_PAUSES: DayPause[] = [
  {
    id: 'p1',
    time: '08:00 a.m.',
    title: 'Inicio de jornada',
    subtitle: '',
    kind: 'start',
    status: 'pending',
    durationMin: 0,
    period: 'mañana',
  },
  {
    id: 'p2',
    time: '10:30 a.m.',
    title: 'Pausa activa',
    subtitle: 'Estiramiento de cuello · 5 min',
    kind: 'active',
    status: 'completed',
    durationMin: 5,
    period: 'mañana',
    routineId: 'pausas-activas',
  },
  {
    id: 'p3',
    time: '12:30 p.m.',
    title: 'Almuerzo',
    subtitle: '60 min',
    kind: 'lunch',
    status: 'info',
    durationMin: 60,
    period: 'mañana',
  },
  {
    id: 'p4',
    time: '03:00 p.m.',
    title: 'Pausa activa',
    subtitle: 'Estiramiento de brazos · 5 min',
    kind: 'active',
    status: 'pending',
    durationMin: 5,
    period: 'tarde',
    routineId: 'pausas-activas',
  },
  {
    id: 'p5',
    time: '04:15 p.m.',
    title: 'Descanso visual',
    subtitle: 'Ejercicios oculares · 5 min',
    kind: 'visual',
    status: 'pending',
    durationMin: 5,
    period: 'tarde',
    routineId: 'salud-visual',
  },
];

export const HOME_GOALS = [
  { id: 'g1', label: 'Pausa de la mañana', done: true },
  { id: 'g2', label: 'Descanso visual', done: true },
  { id: 'g3', label: 'Pausa de la tarde', done: false },
  { id: 'g4', label: 'Respiración', done: false },
];

export const ROUTINES: Routine[] = [
  {
    id: 'pausas-activas',
    name: 'Pausas activas',
    description: 'Estiramientos para liberar tensión',
    category: 'estiramiento',
    duration: '5–10 min',
    pose: 'arms-up',
    tint: '#EEF2FF',
    exercises: [
      {
        id: 'e1',
        name: 'Estiramiento de brazos',
        instruction: 'Levanta lentamente ambos brazos y mantén la posición.',
        seconds: 30,
        pose: 'arms-up',
        tip: '¡Muy bien! Mantén la postura y respira lentamente.',
      },
      {
        id: 'e2',
        name: 'Estiramiento de cuello',
        instruction: 'Inclina la cabeza hacia un lado y sostén sin forzar.',
        seconds: 30,
        pose: 'idle',
        tip: 'Cambia de lado con calma. No rebotes el movimiento.',
      },
      {
        id: 'e3',
        name: 'Rotación de hombros',
        instruction: 'Haz círculos amplios hacia atrás con ambos hombros.',
        seconds: 30,
        pose: 'wave',
        tip: 'Suelta la tensión de la zona cervical y la espalda alta.',
      },
      {
        id: 'e4',
        name: 'Movilidad de muñecas',
        instruction: 'Gira las muñecas en ambos sentidos de forma suave.',
        seconds: 30,
        pose: 'wave',
        tip: 'Ideal después de escribir o usar el mouse por mucho tiempo.',
      },
    ],
  },
  {
    id: 'salud-visual',
    name: 'Salud visual',
    description: 'Descansa tus ojos después de usar pantallas',
    category: 'visual',
    duration: '3–5 min',
    pose: 'eyes',
    tint: '#FDECEC',
    exercises: [
      {
        id: 'v1',
        name: 'Parpadeo consciente',
        instruction: 'Parpadea 20 veces de forma suave y completa.',
        seconds: 25,
        pose: 'eyes',
        tip: 'Lubrica la superficie del ojo y reduce la sequedad.',
      },
      {
        id: 'v2',
        name: 'Enfoque 20-20-20',
        instruction: 'Mira un punto lejano, a más de 6 metros, y relaja la vista.',
        seconds: 30,
        pose: 'idle',
        tip: 'Cada 20 minutos, 20 segundos, a 20 pies de distancia.',
      },
      {
        id: 'v3',
        name: 'Palmeo',
        instruction: 'Cubre tus ojos con las palmas y respira profundo.',
        seconds: 30,
        pose: 'eyes',
        tip: 'La oscuridad ayuda a relajar el músculo ciliar.',
      },
    ],
  },
  {
    id: 'respiracion',
    name: 'Respiración',
    description: 'Respira y recupera tu ritmo',
    category: 'respiracion',
    duration: '3 min',
    pose: 'breathe',
    tint: '#ECFDF3',
    exercises: [
      {
        id: 'r1',
        name: 'Inhala por la nariz',
        instruction: 'Inhala durante 4 segundos llenando el abdomen.',
        seconds: 20,
        pose: 'breathe',
        tip: 'El hombro no debe subir. Respira hacia el abdomen.',
      },
      {
        id: 'r2',
        name: 'Retén el aire',
        instruction: 'Sostén el aire 4 segundos sin tensión.',
        seconds: 20,
        pose: 'breathe',
        tip: 'Mantén el cuello relajado.',
      },
      {
        id: 'r3',
        name: 'Exhala lento',
        instruction: 'Suelta el aire en 6 segundos por la boca.',
        seconds: 25,
        pose: 'idle',
        tip: 'Una exhalación larga activa el sistema de calma.',
      },
    ],
  },
  {
    id: 'movilidad',
    name: 'Movilidad',
    description: 'Activa tu cuerpo durante la jornada',
    category: 'movilidad',
    duration: '5 min',
    pose: 'wave',
    tint: '#EEF2FF',
    exercises: [
      {
        id: 'm1',
        name: 'Marcha en el puesto',
        instruction: 'Levanta rodillas de forma suave durante media minuto.',
        seconds: 30,
        pose: 'wave',
        tip: 'Activa la circulación sin salir de tu espacio.',
      },
      {
        id: 'm2',
        name: 'Rotación de tronco',
        instruction: 'Gira el tronco a izquierda y derecha con brazos sueltos.',
        seconds: 30,
        pose: 'arms-up',
        tip: 'Mueve solo hasta donde sea cómodo.',
      },
      {
        id: 'm3',
        name: 'Estiramiento de piernas',
        instruction: 'Extiende una pierna y flexiona el pie hacia ti.',
        seconds: 30,
        pose: 'idle',
        tip: 'Cambia de pierna a la mitad del tiempo.',
      },
    ],
  },
];

export const HISTORY: HistoryDay[] = [
  { date: '2026-09-16', label: 'Hoy', completed: 1, total: 2 },
  { date: '2026-09-15', label: 'Ayer', completed: 2, total: 2 },
  { date: '2026-09-14', label: 'Lunes', completed: 1, total: 2 },
  { date: '2026-09-13', label: 'Viernes', completed: 2, total: 2 },
  { date: '2026-09-12', label: 'Jueves', completed: 2, total: 2 },
];

export const WORKERS: WorkerTrack[] = [
  {
    id: 101,
    name: 'Sharit Cardona',
    area: 'Administrativa',
    avatar: 'sharit',
    compliance: 92,
    status: 'ok',
    email: 'sharit@uniempresarial.edu.co',
    jornada: '8:00 a.m. – 5:00 p.m.',
    completedToday: 2,
    totalToday: 2,
  },
  {
    id: 102,
    name: 'Laura Martínez',
    area: 'Financiera',
    avatar: 'laura',
    compliance: 87,
    status: 'ok',
    email: 'laura.martinez@uniempresarial.edu.co',
    jornada: '8:00 a.m. – 5:00 p.m.',
    completedToday: 2,
    totalToday: 2,
  },
  {
    id: 103,
    name: 'Carlos Rodríguez',
    area: 'Comercial',
    avatar: 'carlos',
    compliance: 68,
    status: 'pending',
    email: 'carlos.rodriguez@uniempresarial.edu.co',
    jornada: '7:00 a.m. – 4:00 p.m.',
    completedToday: 0,
    totalToday: 2,
  },
  {
    id: 104,
    name: 'María Gómez',
    area: 'Talento Humano',
    avatar: 'maria',
    compliance: 81,
    status: 'pending',
    email: 'maria.gomez@uniempresarial.edu.co',
    jornada: '8:00 a.m. – 5:00 p.m.',
    completedToday: 1,
    totalToday: 2,
  },
];

export const ADMIN_SUMMARY: AdminSummary = {
  compliance: 86,
  scheduled: 124,
  completed: 107,
  pending: 17,
  weekly: [
    { day: 'L', value: 82 },
    { day: 'M', value: 88 },
    { day: 'X', value: 91 },
    { day: 'J', value: 84 },
    { day: 'V', value: 86 },
  ],
  alerts: [
    '5 trabajadores tienen pausas pendientes.',
    '2 áreas presentan bajo cumplimiento.',
  ],
};

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Próxima pausa',
    body: 'Estiramiento de cuello a las 10:30 a.m.',
    time: 'Hace 5 min',
    read: false,
  },
  {
    id: 'n2',
    title: '¡Cumpliste tu pausa!',
    body: 'Registramos tu pausa activa de la mañana.',
    time: 'Hace 2 h',
    read: true,
  },
];

export function roleFromUser(name: string, email: string): SessionUser['role'] {
  const value = `${name} ${email}`.toLowerCase();
  if (value.includes('admin') || email === 'admin@pausas.com') {
    return 'administrador';
  }
  return 'trabajador';
}
