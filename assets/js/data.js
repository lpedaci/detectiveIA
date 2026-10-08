/* =========================================================
   Contenido del caso: niveles, tareas, XP, pistas y rangos.
   Es el único archivo que hace falta tocar para editar la actividad.
   Si cambiás el "id" de una tarea, se descarta el avance guardado de esa tarea.
   ========================================================= */
window.CASO = (() => {
  const LEVELS = [
    { n: 1, name: 'Explorador/a', badge: 'Lupa', icon: 'lupa',
      mission: 'Probá una IA generativa con una consigna real de tu materia y registrá qué resuelve bien y qué inventa.',
      clueTitle: 'Pista 1 · Mensaje de la dirección',
      clue: 'Equipo: el informe de Lucía es impecable y nadie sabe cómo se hizo. Necesito un criterio común antes del viernes. Empecemos por probar la herramienta nosotros mismos.',
      items: [
        { id: '1a', label: 'Entregué la bitácora de exploración', xp: 20 },
        { id: '1b', label: 'Adjunté una captura o ejemplo de la respuesta de la IA', xp: 10 }
      ] },
    { n: 2, name: 'Debatiente', badge: 'Megáfono', icon: 'chat',
      mission: '¿Cuándo la IA acompaña el aprendizaje y cuándo lo reemplaza? Publicá tu postura en el foro Mesa de detectives.',
      clueTitle: 'Pista 2 · Audio de Lucía y chat de la sala de profesores',
      clue: 'El audio y el hilo de chat están en el aula. Escuchalos antes de escribir tu postura.',
      items: [
        { id: '2a', label: 'Publiqué mi postura en el foro', xp: 15 },
        { id: '2b', label: 'Respondí a dos colegas con un argumento o una pregunta', xp: 15 }
      ] },
    { n: 3, name: 'Diseñador/a', badge: 'Plano', icon: 'plano',
      mission: 'Rediseñá una actividad de tu materia incorporando la IA con sentido pedagógico y definí tu pacto de uso.',
      clueTitle: 'Pista 3 · Plantilla del Pacto de uso de IA',
      clue: 'Descargá la plantilla desde el aula. Pide objetivo de aprendizaje, qué hace la IA, qué hace el estudiante, cómo se declara el uso y cómo se evalúa.',
      items: [
        { id: '3a', label: 'Entregué mi pacto completo', xp: 30 },
        { id: '3b', label: 'Ajusté mi pacto después de leer la rúbrica', xp: 20 }
      ] },
    { n: 4, name: 'Mentor/a', badge: 'Brújula', icon: 'brujula',
      mission: 'Compartí tu propuesta y acompañá a un colega con una devolución constructiva.',
      clueTitle: 'Pista 4 · Video final de la dirección',
      clue: 'El video con el cierre del caso está en el aula.',
      items: [
        { id: '4a', label: 'Publiqué mi pacto en el foro de cierre', xp: 10 },
        { id: '4b', label: 'Dejé una devolución: fortaleza, duda y sugerencia', xp: 20 },
        { id: '4c', label: 'Escribí qué cambiaría de mi propuesta', xp: 10 }
      ] }
  ];

  // Orden ascendente: el rango actual es el último cuyo mínimo alcanzaste.
  const RANKS = [
    { min: 0, name: 'Aprendiz de detective' },
    { min: 50, name: 'Detective' },
    { min: 100, name: 'Detective senior' },
    { min: 140, name: 'Jefe/a de investigación' }
  ];

  return { LEVELS, RANKS };
})();
