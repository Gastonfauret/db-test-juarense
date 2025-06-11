const readline = require('readline');
const fs = require('fs');
const path = require('path');

// --- Configuración ---
const RUTA_ARCHIVO_JSON = path.join(__dirname, './datos-socio-01.json');
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DISCIPLINAS_VALIDAS = ["futbol", "hockey", "rugby", "tenis", "paddle", "ninguno"];
const CATEGORIAS_VALIDAS = ["2010", "2011", "2012", "2013", "2014", "2015", "tercera", "primera", "senior"];

// --- Interfaz de lectura de línea ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// --- Función para leer el JSON ---
function leerDatosSocios() {
  try {
    const jsonPath = path.join(__dirname, './datos-socio-01.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    // Asegurarse de que el JSON base tenga la estructura correcta (un array 'socios')
    const datos = JSON.parse(jsonData);
    if (!datos.socios || !Array.isArray(datos.socios)) {
      console.warn('Advertencia: El archivo JSON no tiene la estructura esperada de "socios" como un array. Se inicializará vacío.');
      return { socios: [] };
    }
    return datos;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('Advertencia: El archivo datos-socio-01.json no existe. Se creará uno nuevo.');
      return { socios: [] }; // Si el archivo no existe, devuelve una estructura vacía
    }
    console.error('Error al leer o parsear el archivo JSON:', error.message);
    process.exit(1); // Sale de la aplicación si el JSON es inválido
  }
}

// --- Función para escribir el JSON ---
function guardarDatosSocios(datos) {
  try {
    fs.writeFileSync(RUTA_ARCHIVO_JSON, JSON.stringify(datos, null, 2), 'utf8');
    console.log('Datos guardados correctamente.');
  } catch (error) {
    console.error('Error al guardar el archivo JSON:', error.message);
  }
}

// --- Promesa para obtener input del usuario ---
function preguntar(pregunta) {
  return new Promise(resolve => rl.question(pregunta, resolve));
}

// --- Generadores de IDs únicos ---
function generarNroSocioUnico(datosExistentes) {
    const ultimosNumeros = [];

    // Recolectar nro_socio de titulares
    datosExistentes.socios.forEach(s => {
        const num = parseInt(s.socio_titular.nro_socio.replace('S', ''));
        if (!isNaN(num)) ultimosNumeros.push(num);
    });

    // Recolectar nro_socio de miembros a cargo (si los hay)
    datosExistentes.socios.forEach(s => {
        if (s.grupo_familiar && s.grupo_familiar.miembros_a_cargo) {
            s.grupo_familiar.miembros_a_cargo.forEach(m => {
                const num = parseInt(m.nro_socio.replace('S', ''));
                if (!isNaN(num)) ultimosNumeros.push(num);
            });
        }
    });

    let nuevoNumero = 1;
    while (ultimosNumeros.includes(nuevoNumero)) {
        nuevoNumero++;
    }
    return `S${String(nuevoNumero).padStart(5, '0')}`;
}

function generarIdGrupoFamiliarUnico(datosExistentes) {
    const ultimosNumeros = datosExistentes.socios
        .filter(s => s.grupo_familiar && s.grupo_familiar.id)
        .map(s => parseInt(s.grupo_familiar.id.replace('GF', '')))
        .filter(n => !isNaN(n));

    let nuevoNumero = 1;
    while (ultimosNumeros.includes(nuevoNumero)) {
        nuevoNumero++;
    }
    return `GF${String(nuevoNumero).padStart(3, '0')}`;
}


// --- Funciones de Opciones ---

// Opción 1
function mostrarDatosCompletos(datos) {
  if (datos.socios.length === 0) {
    console.log('No hay socios registrados.');
    return;
  }
  console.log('\n--- DATOS COMPLETOS DE TODOS LOS SOCIOS ---');
  datos.socios.forEach((socio, index) => {
    console.log(`\n--- Socio ${index + 1} ---`);
    console.log('Socio Titular:');
    console.dir(socio.socio_titular, { depth: null, colors: true }); // depth: null para mostrar objetos anidados completos

    if (socio.grupo_familiar) {
      console.log('\nGrupo Familiar (ID:', socio.grupo_familiar.id, '):');
      if (socio.grupo_familiar.miembros_a_cargo && socio.grupo_familiar.miembros_a_cargo.length > 0) {
        socio.grupo_familiar.miembros_a_cargo.forEach((miembro, idx) => {
          console.log(`  Miembro a Cargo ${idx + 1}:`);
          console.dir(miembro, { depth: null, colors: true });
        });
      } else {
        console.log('  Este grupo familiar no tiene miembros a cargo.');
      }
    } else {
      console.log('No pertenece a un grupo familiar.');
    }
  });
}

// Opción 2
function mostrarTitulares(datos) {
  if (datos.socios.length === 0) {
    console.log('No hay socios titulares registrados.');
    return;
  }
  console.log('\n--- DATOS COMPLETOS DE LOS TITULARES DE LOS GRUPOS FAMILIARES ---');
  datos.socios.forEach((socio, index) => {
    console.log(`\n--- Titular ${index + 1} ---`);
    console.dir(socio.socio_titular, { depth: null, colors: true });
  });
}

// Opción 3
function mostrarSociosEnGruposFamiliares(datos) {
  let foundMembers = false;
  console.log('\n--- DATOS COMPLETOS DE LOS SOCIOS EN GRUPOS FAMILIARES ---');
  datos.socios.forEach((socio) => {
    if (socio.grupo_familiar && socio.grupo_familiar.miembros_a_cargo && socio.grupo_familiar.miembros_a_cargo.length > 0) {
      socio.grupo_familiar.miembros_a_cargo.forEach((miembro, idx) => {
        console.log(`\n--- Miembro ${miembro.nro_socio} (Grupo ${socio.grupo_familiar.id}) ---`);
        console.dir(miembro, { depth: null, colors: true });
        foundMembers = true;
      });
    }
  });
  if (!foundMembers) {
    console.log('No hay socios registrados como miembros de grupos familiares.');
  }
}

// Opción 4
function mostrarFiltroTitularesPorCuenta(datos) {
  if (datos.socios.length === 0) {
    console.log('No hay socios titulares para filtrar.');
    return;
  }
  console.log('\n--- FILTRO DE TITULARES POR CUENTA ---');
  datos.socios.forEach((socio, index) => {
    const titular = socio.socio_titular;
    console.log(`\n--- Titular ${index + 1} (Nro Socio: ${titular.nro_socio}) ---`);
    console.log(`Nombre: ${titular.nombre} ${titular.apellido}`);
    console.log(`DNI: ${titular.dni}`);
    console.log(`Email: ${titular.email}`);
    console.log(`Teléfono Celular: ${titular.telefono_celular}`);
    if (titular.tipo_pago && titular.tipo_pago.metodo === 'transferencia_bancaria' && titular.tipo_pago.cbu) {
      console.log(`CBU: ${titular.tipo_pago.cbu}`);
    } else {
      console.log('CBU: N/A (Pago en efectivo o no especificado)');
    }
  });
}

// Opción 5
function mostrarFiltroPagoEfectivo(datos) {
  console.log('\n--- FILTRO DE SOCIOS CON PAGO EN EFECTIVO ---');
  const sociosEfectivo = datos.socios.filter(
    socio => socio.socio_titular.tipo_pago && socio.socio_titular.tipo_pago.metodo === 'efectivo'
  );

  if (sociosEfectivo.length === 0) {
    console.log('No hay socios titulares que paguen en efectivo.');
    return;
  }

  sociosEfectivo.forEach(socio => {
    const titular = socio.socio_titular;
    console.log(`\n- Nro Socio: ${titular.nro_socio}, Nombre: ${titular.nombre} ${titular.apellido}`);
  });
}

// Opción 6
function mostrarFiltroPagoTransferencia(datos) {
  console.log('\n--- FILTRO DE SOCIOS CON PAGO POR TRANSFERENCIA ---');
  const sociosTransferencia = datos.socios.filter(
    socio => socio.socio_titular.tipo_pago && socio.socio_titular.tipo_pago.metodo === 'transferencia_bancaria'
  );

  if (sociosTransferencia.length === 0) {
    console.log('No hay socios titulares que paguen por transferencia.');
    return;
  }

  sociosTransferencia.forEach(socio => {
    const titular = socio.socio_titular;
    console.log(`\n- Nro Socio: ${titular.nro_socio}, Nombre: ${titular.nombre} ${titular.apellido}`);
    console.log(`  CBU: ${titular.tipo_pago.cbu || 'No especificado'}`);
  });
}

// Opción 7
function mostrarFiltroDeudores(datos) {
  console.log('\n--- FILTRO DE DEUDORES ---');
  let foundDeudores = false;

  datos.socios.forEach(socio => {
    // Chequear titular
    if (socio.socio_titular.estado_cuotas && !socio.socio_titular.estado_cuotas.al_dia) {
      console.log(`\n- TITULAR: ${socio.socio_titular.nombre} ${socio.socio_titular.apellido} (Nro Socio: ${socio.socio_titular.nro_socio})`);
      console.log('  Meses con deuda:', socio.socio_titular.estado_cuotas.meses_con_deuda.map(m => `${m.mes} ${m.anio}`).join(', ') || 'N/A');
      foundDeudores = true;
    }
    // Chequear miembros a cargo
    if (socio.grupo_familiar && socio.grupo_familiar.miembros_a_cargo) {
      socio.grupo_familiar.miembros_a_cargo.forEach(miembro => {
        if (miembro.estado_cuotas && !miembro.estado_cuotas.al_dia) {
          console.log(`\n- MIEMBRO: ${miembro.nombre} ${miembro.apellido} (Nro Socio: ${miembro.nro_socio}, Grupo: ${socio.grupo_familiar.id})`);
          console.log('  Meses con deuda:', miembro.estado_cuotas.meses_con_deuda.map(m => `${m.mes} ${m.anio}`).join(', ') || 'N/A');
          foundDeudores = true;
        }
      });
    }
  });

  if (!foundDeudores) {
    console.log('No hay socios o miembros con cuotas adeudadas.');
  }
}

// Opción 8
function mostrarFiltroSociosAlDia(datos) {
  console.log('\n--- FILTRO DE SOCIOS AL DÍA ---');
  let foundAlDia = false;

  datos.socios.forEach(socio => {
    // Chequear titular
    if (socio.socio_titular.estado_cuotas && socio.socio_titular.estado_cuotas.al_dia) {
      console.log(`\n- TITULAR: ${socio.socio_titular.nombre} ${socio.socio_titular.apellido} (Nro Socio: ${socio.socio_titular.nro_socio})`);
      foundAlDia = true;
    }
    // Chequear miembros a cargo
    if (socio.grupo_familiar && socio.grupo_familiar.miembros_a_cargo) {
      socio.grupo_familiar.miembros_a_cargo.forEach(miembro => {
        if (miembro.estado_cuotas && miembro.estado_cuotas.al_dia) {
          console.log(`\n- MIEMBRO: ${miembro.nombre} ${miembro.apellido} (Nro Socio: ${miembro.nro_socio}, Grupo: ${socio.grupo_familiar.id})`);
          foundAlDia = true;
        }
      });
    }
  });

  if (!foundAlDia) {
    console.log('No hay socios o miembros completamente al día con sus cuotas.');
  }
}

// Opción 9
async function filtrarPorDisciplinaYCategoria(datos) {
  console.log('\n--- FILTRO DE DISCIPLINAS Y CATEGORÍAS ---');

  // 1. Listar Disciplinas disponibles
  console.log('Disciplinas disponibles:');
  DISCIPLINAS_VALIDAS.forEach((d, i) => console.log(`${i + 1}. ${d}`));
  const opcionDisciplina = await preguntar('Seleccione el número de la disciplina (o escriba "ninguno" para volver): ');
  let disciplinaSeleccionada = DISCIPLINAS_VALIDAS[parseInt(opcionDisciplina) - 1];

  if (!disciplinaSeleccionada) {
    disciplinaSeleccionada = opcionDisciplina.toLowerCase();
    if (!DISCIPLINAS_VALIDAS.includes(disciplinaSeleccionada)) {
      console.log('Disciplina no válida. Volviendo al menú principal.');
      return; // Vuelve al menú anterior
    }
  }

  let categoriaSeleccionada = null;
  if (disciplinaSeleccionada !== 'ninguno') {
    // 2. Listar Categorías disponibles
    console.log('\nCategorías disponibles para esta disciplina:');
    console.log('0. Todas las categorías');
    CATEGORIAS_VALIDAS.forEach((c, i) => console.log(`${i + 1}. ${c}`));
    const opcionCategoria = await preguntar('Seleccione el número de la categoría (o "0" para todas, o Enter para volver): ');
    if (opcionCategoria === '') { // Si el usuario solo presiona Enter
        console.log('Volviendo al menú principal.');
        return; // Vuelve al menú anterior
    }
    if (opcionCategoria === '0') {
      categoriaSeleccionada = 'todas';
    } else {
      categoriaSeleccionada = CATEGORIAS_VALIDAS[parseInt(opcionCategoria) - 1];
      if (!categoriaSeleccionada) {
        console.log('Categoría no válida. Volviendo al menú principal.');
        return; // Vuelve al menú anterior
      }
    }
  }

  console.log(`\nResultados para Disciplina: "${disciplinaSeleccionada}" ${categoriaSeleccionada ? `y Categoría: "${categoriaSeleccionada}"` : ''}:`);
  let foundSocios = false;

  datos.socios.forEach(socio => {
    // Chequear titular
    const titularPractica = socio.socio_titular.disciplinas.some(d =>
      d.nombre_disciplina === disciplinaSeleccionada &&
      (categoriaSeleccionada === 'todas' || !d.categoria || d.categoria === categoriaSeleccionada)
    );
    if (titularPractica) {
      console.log(`\n- TITULAR: ${socio.socio_titular.nombre} ${socio.socio_titular.apellido} (Nro Socio: ${socio.socio_titular.nro_socio})`);
      socio.socio_titular.disciplinas.filter(d => d.nombre_disciplina === disciplinaSeleccionada).forEach(d => {
        console.log(`  Disciplina: ${d.nombre_disciplina}${d.categoria ? `, Categoría: ${d.categoria}` : ''}`);
      });
      foundSocios = true;
    }

    // Chequear miembros a cargo
    if (socio.grupo_familiar && socio.grupo_familiar.miembros_a_cargo) {
      socio.grupo_familiar.miembros_a_cargo.forEach(miembro => {
        const miembroPractica = miembro.disciplinas.some(d =>
          d.nombre_disciplina === disciplinaSeleccionada &&
          (categoriaSeleccionada === 'todas' || !d.categoria || d.categoria === categoriaSeleccionada)
        );
        if (miembroPractica) {
          console.log(`\n- MIEMBRO: ${miembro.nombre} ${miembro.apellido} (Nro Socio: ${miembro.nro_socio}, Grupo: ${socio.grupo_familiar.id})`);
          miembro.disciplinas.filter(d => d.nombre_disciplina === disciplinaSeleccionada).forEach(d => {
            console.log(`  Disciplina: ${d.nombre_disciplina}${d.categoria ? `, Categoría: ${d.categoria}` : ''}`);
          });
          foundSocios = true;
        }
      });
    }
  });

  if (!foundSocios) {
    console.log(`No se encontraron socios que practiquen "${disciplinaSeleccionada}" ${categoriaSeleccionada ? `en la categoría "${categoriaSeleccionada}"` : ''}.`);
  }
}

// Opción 10
async function crearNuevoSocio(datos) {
  console.log('\n--- CREACIÓN DE NUEVO SOCIO ---');

  const nro_socio = generarNroSocioUnico(datos);
  console.log(`Nuevo Nro de Socio asignado: ${nro_socio}`);

  const nombre = await preguntar('Nombre del socio (o "0" para volver): ');
  if (nombre === '0') { console.log('Creación cancelada.'); return; }
  const apellido = await preguntar('Apellido del socio: ');
  const dni = await preguntar('DNI del socio: ');
  const fecha_nacimiento_str = await preguntar('Fecha de nacimiento (AAAA-MM-DD): ');
  const email = await preguntar('Email del socio: ');
  const telefono_celular = await preguntar('Teléfono celular del socio (+549...): ');

  // Disciplinas
  let disciplinas = [];
  let agregarMasDisciplinas = true;
  while (agregarMasDisciplinas) {
    console.log('\nDisciplinas disponibles:');
    DISCIPLINAS_VALIDAS.forEach((d, i) => console.log(`${i + 1}. ${d}`));
    const opcionDisc = await preguntar('Seleccione el número de la disciplina (o "ninguno" para terminar/volver): ');
    let nombre_disciplina = DISCIPLINAS_VALIDAS[parseInt(opcionDisc) - 1];

    if (!nombre_disciplina) {
      nombre_disciplina = opcionDisc.toLowerCase();
      if (!DISCIPLINAS_VALIDAS.includes(nombre_disciplina)) {
        console.log('Disciplina no válida. Intente de nuevo.');
        continue;
      }
    }

    if (nombre_disciplina === 'ninguno') {
      disciplinas.push({ nombre_disciplina: "ninguno" }); // Añadir explícitamente "ninguno"
      agregarMasDisciplinas = false;
    } else {
      let categoria = null;
      console.log('\nCategorías disponibles:');
      CATEGORIAS_VALIDAS.forEach((c, i) => console.log(`${i + 1}. ${c}`));
      const opcionCat = await preguntar('Seleccione el número de la categoría (o Enter si no aplica): ');
      if (opcionCat) {
          categoria = CATEGORIAS_VALIDAS[parseInt(opcionCat) - 1];
          if (!categoria) {
              console.log('Categoría no válida. No se asignará categoría.');
              categoria = undefined; // Asegura que no se guarde null
          }
      }
      if (categoria) {
          disciplinas.push({ nombre_disciplina, categoria });
      } else {
          disciplinas.push({ nombre_disciplina });
      }

      const continuar = await preguntar('¿Desea agregar otra disciplina? (s/n): ');
      if (continuar.toLowerCase() !== 's') {
        agregarMasDisciplinas = false;
      }
    }
  }
  if (disciplinas.length === 0) { // Si no se agregó ninguna y no se eligió "ninguno"
      disciplinas.push({ nombre_disciplina: "ninguno" });
  }


  // Estado de cuotas (por defecto, al día, se asume que al crear paga la primera cuota)
  const fechaActual = new Date();
  const mesActual = MESES[fechaActual.getMonth()];
  const anioActual = fechaActual.getFullYear();
  const estado_cuotas = {
    al_dia: true,
    cuotas_pagadas_al_dia: [{ mes: mesActual, anio: anioActual, estado: "pagada" }],
    meses_con_deuda: []
  };

  // Tipo de pago
  const metodoPago = await preguntar('Método de pago (efectivo/transferencia_bancaria): ');
  let tipo_pago = { metodo: metodoPago.toLowerCase() };
  if (tipo_pago.metodo === 'transferencia_bancaria') {
    tipo_pago.cbu = await preguntar('CBU (para transferencia bancaria): ');
  } else if (tipo_pago.metodo !== 'efectivo') {
    console.log('Método de pago no válido. Se establecerá como "efectivo" por defecto.');
    tipo_pago = { metodo: 'efectivo' };
  }


  // Grupo familiar
  const esTitularGrupo = await preguntar('¿Es este socio el titular de un nuevo grupo familiar? (s/n): ');
  let id_grupo_familiar = null;
  let nuevoGrupoFamiliar = null;

  if (esTitularGrupo.toLowerCase() === 's') {
    id_grupo_familiar = generarIdGrupoFamiliarUnico(datos);
    nuevoGrupoFamiliar = {
      id: id_grupo_familiar,
      miembros_a_cargo: []
    };

    let agregarMiembro = await preguntar('¿Desea agregar familiares a cargo ahora? (s/n): ');
    while (agregarMiembro.toLowerCase() === 's') {
      console.log('\n--- Datos del Miembro a Cargo ---');
      const nro_socio_miembro = generarNroSocioUnico(datos);
      console.log(`Nuevo Nro de Socio para miembro: ${nro_socio_miembro}`);

      const nombre_miembro = await preguntar('Nombre del miembro (o "0" para volver): ');
      if (nombre_miembro === '0') { console.log('Creación de miembro cancelada.'); break; } // Salir del bucle de miembros
      const apellido_miembro = await preguntar('Apellido del miembro: ');
      const dni_miembro = await preguntar('DNI del miembro: ');
      const fecha_nacimiento_miembro_str = await preguntar('Fecha de nacimiento del miembro (AAAA-MM-DD): ');
      const email_miembro = await preguntar('Email del miembro: ');
      const telefono_celular_miembro = await preguntar('Teléfono celular del miembro (+549...): ');

      // Disciplinas para el miembro
      let disciplinasMiembro = [];
      let agregarMasDisciplinasMiembro = true;
      while (agregarMasDisciplinasMiembro) {
        console.log('\nDisciplinas disponibles para miembro:');
        DISCIPLINAS_VALIDAS.forEach((d, i) => console.log(`${i + 1}. ${d}`));
        const opcionDiscMiembro = await preguntar('Seleccione el número de la disciplina (o "ninguno" para terminar/volver): ');
        let nombre_disciplina_miembro = DISCIPLINAS_VALIDAS[parseInt(opcionDiscMiembro) - 1];

        if (!nombre_disciplina_miembro) {
            nombre_disciplina_miembro = opcionDiscMiembro.toLowerCase();
            if (!DISCIPLINAS_VALIDAS.includes(nombre_disciplina_miembro)) {
                console.log('Disciplina no válida. Intente de nuevo.');
                continue;
            }
        }

        if (nombre_disciplina_miembro === 'ninguno') {
            disciplinasMiembro.push({ nombre_disciplina: "ninguno" });
            agregarMasDisciplinasMiembro = false;
        } else {
            let categoriaMiembro = null;
            console.log('\nCategorías disponibles para miembro:');
            CATEGORIAS_VALIDAS.forEach((c, i) => console.log(`${i + 1}. ${c}`));
            const opcionCatMiembro = await preguntar('Seleccione el número de la categoría (o Enter si no aplica): ');
            if (opcionCatMiembro) {
                categoriaMiembro = CATEGORIAS_VALIDAS[parseInt(opcionCatMiembro) - 1];
                if (!categoriaMiembro) {
                    console.log('Categoría no válida. No se asignará categoría.');
                    categoriaMiembro = undefined;
                }
            }
            if (categoriaMiembro) {
                disciplinasMiembro.push({ nombre_disciplina: nombre_disciplina_miembro, categoria: categoriaMiembro });
            } else {
                disciplinasMiembro.push({ nombre_disciplina: nombre_disciplina_miembro });
            }

            const continuarMiembro = await preguntar('¿Desea agregar otra disciplina al miembro? (s/n): ');
            if (continuarMiembro.toLowerCase() !== 's') {
              agregarMasDisciplinasMiembro = false;
            }
        }
      }
      if (disciplinasMiembro.length === 0) {
          disciplinasMiembro.push({ nombre_disciplina: "ninguno" });
      }


      // Estado de cuotas para el miembro (se asume al día al momento de agregar)
      const estado_cuotas_miembro = {
        al_dia: true,
        cuotas_pagadas_al_dia: [{ mes: mesActual, anio: anioActual, estado: "pagada" }],
        meses_con_deuda: []
      };

      const nuevoMiembro = {
        nro_socio: nro_socio_miembro,
        nombre: nombre_miembro,
        apellido: apellido_miembro,
        dni: dni_miembro,
        fecha_nacimiento: fecha_nacimiento_miembro_str,
        email: email_miembro,
        telefono_celular: telefono_celular_miembro,
        disciplinas: disciplinasMiembro,
        estado_cuotas: estado_cuotas_miembro
      };
      nuevoGrupoFamiliar.miembros_a_cargo.push(nuevoMiembro);

      agregarMiembro = await preguntar('¿Desea agregar otro familiar a cargo? (s/n): ');
    }
  }

  const nuevoSocioTitular = {
    nro_socio,
    nombre,
    apellido,
    dni,
    fecha_nacimiento: fecha_nacimiento_str,
    email,
    telefono_celular,
    disciplinas,
    estado_cuotas,
    tipo_pago,
    id_grupo_familiar: id_grupo_familiar // Será null si no es titular de grupo
  };

  datos.socios.push({
      socio_titular: nuevoSocioTitular,
      grupo_familiar: nuevoGrupoFamiliar // Será null si no crea un grupo
  });

  guardarDatosSocios(datos);
  console.log('Socio creado exitosamente.');
}

// Opción 11
async function modificarSocio(datos) {
  console.log('\n--- MODIFICACIÓN DE DATOS DE SOCIO ---');
  const nroSocioAModificar = await preguntar('Ingrese el Nro de Socio a modificar (o "0" para volver): ');
  if (nroSocioAModificar === '0') { console.log('Modificación cancelada.'); return; }

  let socioEncontrado = null;
  let esTitular = false;
  let socioContenedorEnArraySocios = null; // Referencia al objeto { socio_titular, grupo_familiar }
  let indiceContenedorEnArraySocios = -1; // Índice de ese objeto en datos.socios

  // Buscar el socio: primero entre titulares
  for (let i = 0; i < datos.socios.length; i++) {
      if (datos.socios[i].socio_titular.nro_socio === nroSocioAModificar) {
          socioEncontrado = datos.socios[i].socio_titular;
          socioContenedorEnArraySocios = datos.socios[i];
          indiceContenedorEnArraySocios = i;
          esTitular = true;
          break;
      }
  }

  // Si no es titular, buscar en los miembros a cargo
  if (!socioEncontrado) {
      for (let i = 0; i < datos.socios.length; i++) {
          const s = datos.socios[i];
          if (s.grupo_familiar && s.grupo_familiar.miembros_a_cargo) {
              const miembroIndex = s.grupo_familiar.miembros_a_cargo.findIndex(m => m.nro_socio === nroSocioAModificar);
              if (miembroIndex !== -1) {
                  socioEncontrado = s.grupo_familiar.miembros_a_cargo[miembroIndex];
                  esTitular = false;
                  break;
              }
          }
      }
  }


  if (!socioEncontrado) {
    console.log(`Socio con Nro ${nroSocioAModificar} no encontrado.`);
    return;
  }

  console.log(`\nSocio encontrado: ${socioEncontrado.nombre} ${socioEncontrado.apellido}`);
  console.log('¿Qué desea modificar?');
  console.log('1. Nombre');
  console.log('2. Apellido');
  console.log('3. DNI');
  console.log('4. Fecha de Nacimiento');
  console.log('5. Email');
  console.log('6. Teléfono Celular');
  console.log('7. Disciplinas');
  console.log('8. Estado de Cuotas');
  if (esTitular) { // Opciones solo para titulares
    console.log('9. Tipo de Pago');
    console.log('10. Pertenencia a Grupo Familiar (si es titular de grupo o se une a uno)');
  }
  console.log('0. Volver al menú anterior'); // Opción para volver

  const opcion = await preguntar('Ingrese el número de la opción: ');
  if (opcion === '0') { console.log('Modificación cancelada.'); return; } // Manejar la opción de volver

  switch (opcion) {
    case '1':
      socioEncontrado.nombre = await preguntar(`Nuevo nombre (${socioEncontrado.nombre}): `) || socioEncontrado.nombre;
      break;
    case '2':
      socioEncontrado.apellido = await preguntar(`Nuevo apellido (${socioEncontrado.apellido}): `) || socioEncontrado.apellido;
      break;
    case '3':
      socioEncontrado.dni = await preguntar(`Nuevo DNI (${socioEncontrado.dni}): `) || socioEncontrado.dni;
      break;
    case '4':
      socioEncontrado.fecha_nacimiento = await preguntar(`Nueva fecha de nacimiento (AAAA-MM-DD, actual: ${socioEncontrado.fecha_nacimiento}): `) || socioEncontrado.fecha_nacimiento;
      break;
    case '5':
      socioEncontrado.email = await preguntar(`Nuevo email (${socioEncontrado.email}): `) || socioEncontrado.email;
      break;
    case '6':
      socioEncontrado.telefono_celular = await preguntar(`Nuevo teléfono celular (${socioEncontrado.telefono_celular}): `) || socioEncontrado.telefono_celular;
      break;
    case '7':
      console.log('--- Modificar Disciplinas ---');
      let nuevasDisciplinas = [];
      let agregarMas = true;
      while (agregarMas) {
        console.log('\nDisciplinas disponibles:');
        DISCIPLINAS_VALIDAS.forEach((d, i) => console.log(`${i + 1}. ${d}`));
        const opcionDisc = await preguntar('Seleccione el número de la disciplina (o "ninguno" para terminar/volver): ');
        let nombre_disciplina = DISCIPLINAS_VALIDAS[parseInt(opcionDisc) - 1];

        if (!nombre_disciplina) {
          nombre_disciplina = opcionDisc.toLowerCase();
          if (!DISCIPLINAS_VALIDAS.includes(nombre_disciplina)) {
            console.log('Disciplina no válida. Intente de nuevo.');
            continue;
          }
        }

        if (nombre_disciplina === 'ninguno') {
          nuevasDisciplinas.push({ nombre_disciplina: "ninguno" });
          agregarMas = false;
        } else {
          let categoria = null;
          console.log('\nCategorías disponibles:');
          CATEGORIAS_VALIDAS.forEach((c, i) => console.log(`${i + 1}. ${c}`));
          const opcionCat = await preguntar('Seleccione el número de la categoría (o Enter si no aplica): ');
          if (opcionCat) {
              categoria = CATEGORIAS_VALIDAS[parseInt(opcionCat) - 1];
              if (!categoria) {
                  console.log('Categoría no válida. No se asignará categoría.');
                  categoria = undefined;
              }
          }
          if (categoria) {
              nuevasDisciplinas.push({ nombre_disciplina, categoria });
          } else {
              nuevasDisciplinas.push({ nombre_disciplina });
          }

          const continuar = await preguntar('¿Desea agregar otra disciplina? (s/n): ');
          if (continuar.toLowerCase() !== 's') {
            agregarMas = false;
          }
        }
      }
      if (nuevasDisciplinas.length === 0) {
          nuevasDisciplinas.push({ nombre_disciplina: "ninguno" });
      }
      socioEncontrado.disciplinas = nuevasDisciplinas;
      break;
    case '8':
      console.log('--- Modificar Estado de Cuotas ---');
      const alDiaInput = await preguntar(`¿Está al día con las cuotas? (s/n, actual: ${socioEncontrado.estado_cuotas.al_dia ? 's' : 'n'}): `);
      socioEncontrado.estado_cuotas.al_dia = alDiaInput.toLowerCase() === 's';

      if (socioEncontrado.estado_cuotas.al_dia) {
          socioEncontrado.estado_cuotas.meses_con_deuda = [];
      } else {
          let agregarDeuda = await preguntar('¿Desea agregar meses con deuda? (s/n): ');
          socioEncontrado.estado_cuotas.meses_con_deuda = []; // Resetear para volver a cargar
          while (agregarDeuda.toLowerCase() === 's') {
              const mes = await preguntar('Mes (ej: Enero): ');
              const anio = await preguntar('Año (ej: 2025): ');
              socioEncontrado.estado_cuotas.meses_con_deuda.push({ mes, anio: parseInt(anio) });
              agregarDeuda = await preguntar('¿Desea agregar otro mes con deuda? (s/n): ');
          }
      }

      let agregarPagadas = await preguntar('¿Desea actualizar meses pagados? (s/n): ');
      if (agregarPagadas.toLowerCase() === 's') {
          socioEncontrado.estado_cuotas.cuotas_pagadas_al_dia = []; // Resetear para volver a cargar
          let continuarPagadas = true;
          while (continuarPagadas) {
              const mes = await preguntar('Mes pagado (ej: Enero): ');
              const anio = await preguntar('Año pagado (ej: 2025): ');
              socioEncontrado.estado_cuotas.cuotas_pagadas_al_dia.push({ mes, anio: parseInt(anio), estado: "pagada" });
              const continuar = await preguntar('¿Desea agregar otro mes pagado? (s/n): ');
              if (continuar.toLowerCase() !== 's') {
                  continuarPagadas = false;
              }
          }
      }
      break;
    case '9':
      if (esTitular) {
        console.log('--- Modificar Tipo de Pago ---');
        const nuevoMetodo = await preguntar(`Nuevo método de pago (efectivo/transferencia_bancaria, actual: ${socioEncontrado.tipo_pago.metodo}): `);
        socioEncontrado.tipo_pago.metodo = nuevoMetodo.toLowerCase();
        if (socioEncontrado.tipo_pago.metodo === 'transferencia_bancaria') {
          socioEncontrado.tipo_pago.cbu = await preguntar(`Nuevo CBU (actual: ${socioEncontrado.tipo_pago.cbu || 'N/A'}): `) || socioEncontrado.tipo_pago.cbu;
        } else {
          delete socioEncontrado.tipo_pago.cbu; // Eliminar CBU si el método no es transferencia
        }
      } else {
        console.log('Opción no válida para miembros a cargo.');
      }
      break;
    case '10':
      if (esTitular) {
          const tieneGrupo = await preguntar(`¿Pertenece a un grupo familiar? (s/n, actual: ${socioEncontrado.id_grupo_familiar ? 's' : 'n'}): `);
          if (tieneGrupo.toLowerCase() === 's') {
              let idGrupoExistente = await preguntar('Ingrese el ID de un grupo familiar existente (o deje vacío para crear uno nuevo): ');
              if (idGrupoExistente) {
                  // Buscar grupo existente
                  const grupoExistente = datos.socios.find(s => s.grupo_familiar && s.grupo_familiar.id === idGrupoExistente)?.grupo_familiar;
                  if (grupoExistente) {
                      socioEncontrado.id_grupo_familiar = idGrupoExistente;
                      socioContenedorEnArraySocios.grupo_familiar = grupoExistente; // Asignar al grupo existente
                      console.log(`Socio asignado a grupo familiar existente: ${idGrupoExistente}.`);
                  } else {
                      console.log('ID de grupo familiar no encontrado. Se creará un nuevo grupo.');
                      const nuevoIdGrupo = generarIdGrupoFamiliarUnico(datos);
                      socioEncontrado.id_grupo_familiar = nuevoIdGrupo;
                      socioContenedorEnArraySocios.grupo_familiar = { id: nuevoIdGrupo, miembros_a_cargo: [] };
                      console.log(`Nuevo grupo familiar creado con ID: ${nuevoIdGrupo}`);
                  }
              } else {
                  const nuevoIdGrupo = generarIdGrupoFamiliarUnico(datos);
                  socioEncontrado.id_grupo_familiar = nuevoIdGrupo;
                  socioContenedorEnArraySocios.grupo_familiar = { id: nuevoIdGrupo, miembros_a_cargo: [] };
                  console.log(`Nuevo grupo familiar creado con ID: ${nuevoIdGrupo}`);
              }
          } else {
              socioEncontrado.id_grupo_familiar = null;
              if (socioContenedorEnArraySocios && socioContenedorEnArraySocios.grupo_familiar) {
                  const eliminarGrupo = await preguntar(`El socio era titular del grupo ${socioContenedorEnArraySocios.grupo_familiar.id}. ¿Desea eliminar también este grupo familiar y sus miembros a cargo? (s/n): `);
                  if (eliminarGrupo.toLowerCase() === 's') {
                      socioContenedorEnArraySocios.grupo_familiar = null; // Elimina el grupo del titular
                      console.log(`Grupo familiar ${socioContenedorEnArraySocios.grupo_familiar.id} eliminado del socio.`);
                  } else {
                      console.log('El grupo familiar se mantiene, pero este socio ya no es su titular.');
                  }
              }
          }
      } else {
          console.log('Opción no válida para miembros a cargo.');
      }
      break;
    default:
      console.log('Opción no válida.');
      break;
  }

  guardarDatosSocios(datos);
  console.log('Socio modificado exitosamente.');
}

// Opción 12
async function eliminarSocio(datos) {
  console.log('\n--- ELIMINACIÓN DE SOCIO ---');
  const nroSocioAEliminar = await preguntar('Ingrese el Nro de Socio a eliminar (o "0" para volver): ');
  if (nroSocioAEliminar === '0') { console.log('Eliminación cancelada.'); return; }

  let indiceSocioPrincipal = -1; // Índice del objeto { socio_titular, grupo_familiar } en el array 'socios'
  let esTitularPrincipal = false; // Indica si el nroSocioAEliminar es el socio_titular principal de una entrada en el array 'socios'
  let grupoFamiliarDelMiembro = null; // Si el socio es un miembro a cargo, esta es la referencia a su grupo familiar
  let indiceMiembroDentroGrupo = -1; // Si el socio es un miembro a cargo, este es su índice en el array 'miembros_a_cargo'

  // 1. Buscar si es un socio_titular principal en el array 'socios'
  indiceSocioPrincipal = datos.socios.findIndex(s => s.socio_titular.nro_socio === nroSocioAEliminar);
  if (indiceSocioPrincipal !== -1) {
    esTitularPrincipal = true;
  } else {
    // 2. Si no es un socio_titular principal, buscar si es un miembro_a_cargo en algún grupo familiar
    for (let i = 0; i < datos.socios.length; i++) {
      const socioEnArray = datos.socios[i];
      if (socioEnArray.grupo_familiar && socioEnArray.grupo_familiar.miembros_a_cargo) {
        indiceMiembroDentroGrupo = socioEnArray.grupo_familiar.miembros_a_cargo.findIndex(m => m.nro_socio === nroSocioAEliminar);
        if (indiceMiembroDentroGrupo !== -1) {
          grupoFamiliarDelMiembro = socioEnArray.grupo_familiar;
          break; // Encontrado el miembro a cargo
        }
      }
    }
  }

  if (indiceSocioPrincipal === -1 && indiceMiembroDentroGrupo === -1) {
    console.log(`Socio con Nro ${nroSocioAEliminar} no encontrado.`);
    return;
  }

  const confirmacion = await preguntar(`¿Está seguro de eliminar al socio ${nroSocioAEliminar}? (s/n): `);
  if (confirmacion.toLowerCase() !== 's') {
    console.log('Eliminación cancelada.');
    return;
  }

  if (esTitularPrincipal) {
    // Caso: El socio a eliminar es un socio_titular principal
    const socioContenedor = datos.socios[indiceSocioPrincipal];
    if (socioContenedor.grupo_familiar) {
      console.log(`El socio ${nroSocioAEliminar} es el titular del grupo familiar ${socioContenedor.grupo_familiar.id}.`);
      const eliminarGrupoTambien = await preguntar(`¿Desea eliminar también el grupo familiar asociado y sus miembros a cargo? (s/n): `);
      if (eliminarGrupoTambien.toLowerCase() === 's') {
        datos.socios.splice(indiceSocioPrincipal, 1);
        console.log(`Socio ${nroSocioAEliminar} y su grupo familiar ${socioContenedor.grupo_familiar.id} eliminados.`);
      } else {
        datos.socios.splice(indiceSocioPrincipal, 1);
        console.log(`Socio ${nroSocioAEliminar} eliminado. Su grupo familiar asociado fue eliminado junto con él. Para mantener los miembros del grupo, debería modificar esta lógica.`);
      }
    } else {
      // El socio titular no tiene grupo familiar
      datos.socios.splice(indiceSocioPrincipal, 1);
      console.log(`Socio ${nroSocioAEliminar} eliminado.`);
    }
  } else {
    // Caso: El socio a eliminar es un miembro_a_cargo
    if (grupoFamiliarDelMiembro && indiceMiembroDentroGrupo !== -1) {
      const nombreMiembro = grupoFamiliarDelMiembro.miembros_a_cargo[indiceMiembroDentroGrupo].nombre;
      grupoFamiliarDelMiembro.miembros_a_cargo.splice(indiceMiembroDentroGrupo, 1);
      console.log(`Miembro ${nombreMiembro} (Nro Socio: ${nroSocioAEliminar}) eliminado del grupo familiar ${grupoFamiliarDelMiembro.id}.`);
    }
  }

  guardarDatosSocios(datos);
  console.log('Operación de eliminación completada.');
}

// --- Opción 13 - Buscar Socio por Múltiples Criterios (MODIFICADA) ---
async function buscarSocioPorMultiplesCriterios(datos) {
    console.log('\n--- BÚSQUEDA DE SOCIO ---');
    console.log('1. Buscar por Apellido');
    console.log('2. Buscar por Nro de Socio');
    console.log('3. Buscar por CBU');
    console.log('4. Buscar por ID de Grupo Familiar');
    console.log('0. Volver al menú anterior');

    const opcionBusqueda = await preguntar('Seleccione el criterio de búsqueda: ');
    if (opcionBusqueda === '0') { console.log('Búsqueda cancelada.'); return; }

    let valorBuscado = '';
    let criterio = '';

    switch (opcionBusqueda) {
        case '1':
            criterio = 'apellido';
            valorBuscado = (await preguntar('Ingrese el Apellido a buscar: ')).toLowerCase().trim();
            break;
        case '2':
            criterio = 'nro_socio';
            valorBuscado = (await preguntar('Ingrese el Nro de Socio a buscar: ')).toUpperCase().trim();
            break;
        case '3':
            criterio = 'cbu';
            valorBuscado = (await preguntar('Ingrese el CBU a buscar: ')).trim();
            break;
        case '4':
            criterio = 'id_grupo_familiar';
            valorBuscado = (await preguntar('Ingrese el ID de Grupo Familiar a buscar: ')).toUpperCase().trim();
            break;
        default:
            console.log('Opción de búsqueda no válida.');
            return;
    }

    if (!valorBuscado) {
        console.log('Valor de búsqueda no proporcionado. Volviendo al menú anterior.');
        return;
    }

    let resultados = [];

    datos.socios.forEach(socioContenedor => {
        const titular = socioContenedor.socio_titular;
        const grupoFamiliar = socioContenedor.grupo_familiar;

        // Función auxiliar para verificar si un socio/miembro coincide con el criterio
        const coincide = (persona, esTitularPersona = false) => {
            switch (criterio) {
                case 'apellido':
                    return persona.apellido.toLowerCase().includes(valorBuscado);
                case 'nro_socio':
                    return persona.nro_socio === valorBuscado;
                case 'cbu':
                    return esTitularPersona && persona.tipo_pago && persona.tipo_pago.metodo === 'transferencia_bancaria' && persona.tipo_pago.cbu === valorBuscado;
                case 'id_grupo_familiar':
                    return (esTitularPersona && titular.id_grupo_familiar === valorBuscado) ||
                           (!esTitularPersona && grupoFamiliar && grupoFamiliar.id === valorBuscado);
                default:
                    return false;
            }
        };

        // 1. Chequear al Socio Titular
        if (coincide(titular, true)) {
            resultados.push({ tipo: 'TITULAR', data: titular });
        }

        // 2. Chequear a los Miembros a Cargo del grupo familiar
        if (grupoFamiliar && grupoFamiliar.miembros_a_cargo) {
            grupoFamiliar.miembros_a_cargo.forEach(miembro => {
                // Aquí el ID de grupo familiar para el miembro debe coincidir con el ID del grupo que lo contiene
                if (coincide(miembro, false)) { // Pasa false para indicar que no es el titular principal del objeto
                    resultados.push({ tipo: `MIEMBRO_GRUPO_${grupoFamiliar.id}`, data: miembro });
                }
            });
        }
    });

    if (resultados.length > 0) {
        console.log('\n--- RESULTADOS DE LA BÚSQUEDA ---');
        resultados.forEach((res, index) => {
            console.log(`\n--- Resultado ${index + 1} (${res.tipo}) ---`);
            console.dir(res.data, { depth: null, colors: true });
        });
    } else {
        console.log(`No se encontraron socios que coincidan con el ${criterio} "${valorBuscado}".`);
    }
}


// --- Menú Principal ---
async function mostrarMenu() {
  console.log('\n--- ADMINISTRACIÓN DE SOCIOS DEL CLUB ---');
  console.log('1. Datos completos de los socios');
  console.log('2. Datos completos de los titulares de los grupos familiares');
  console.log('3. Datos completos de los socios en grupos familiares');
  console.log('4. Filtro de Titulares por cuenta');
  console.log('5. Filtro de pago efectivo');
  console.log('6. Filtro de pago por transferencia');
  console.log('7. Filtro de deudores');
  console.log('8. Filtro de socios al día');
  console.log('9. Filtro de disciplinas');
  console.log('10. Creación de nuevo socio');
  console.log('11. Modificación de datos de socio');
  console.log('12. Eliminación de socio');
  console.log('13. Buscar socio por criterios'); // Nueva opción
  console.log('0. Salir'); // Opción principal de salida
}

// --- Función Principal de la Aplicación ---
async function main() {
  let datosSocios = leerDatosSocios(); // Carga inicial de datos

  let salir = false;
  while (!salir) {
    await mostrarMenu();
    const opcion = await preguntar('Seleccione una opción: ');

    switch (opcion) {
      case '1':
        mostrarDatosCompletos(datosSocios);
        break;
      case '2':
        mostrarTitulares(datosSocios);
        break;
      case '3':
        mostrarSociosEnGruposFamiliares(datosSocios);
        break;
      case '4':
        mostrarFiltroTitularesPorCuenta(datosSocios);
        break;
      case '5':
        mostrarFiltroPagoEfectivo(datosSocios);
        break;
      case '6':
        mostrarFiltroPagoTransferencia(datosSocios);
        break;
      case '7':
        mostrarFiltroDeudores(datosSocios);
        break;
      case '8':
        mostrarFiltroSociosAlDia(datosSocios);
        break;
      case '9':
        await filtrarPorDisciplinaYCategoria(datosSocios);
        break;
      case '10':
        await crearNuevoSocio(datosSocios);
        datosSocios = leerDatosSocios(); // Recargar datos para reflejar el socio recién creado
        break;
      case '11':
        await modificarSocio(datosSocios);
        datosSocios = leerDatosSocios(); // Recargar datos para reflejar las modificaciones
        break;
      case '12':
        await eliminarSocio(datosSocios);
        datosSocios = leerDatosSocios(); // Recargar datos para reflejar la eliminación
        break;
      case '13': // Nuevo caso para la opción de búsqueda
        await buscarSocioPorMultiplesCriterios(datosSocios);
        break;
      case '0': // La opción 0 en el menú principal ahora es "Salir"
        salir = true;
        console.log('Saliendo de la aplicación. ¡Hasta luego!');
        break;
      default:
        console.log('Opción no válida. Por favor, intente de nuevo.');
        break;
    }
    if (!salir) { // No pausar si el usuario eligió salir
        await preguntar('\nPresione Enter para continuar...'); // Pausar para que el usuario pueda leer la salida
    }
  }
  rl.close(); // Cierra la interfaz de lectura de línea al salir
}

// Iniciar la aplicación
main();