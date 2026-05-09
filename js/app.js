// ===== Variables globales =====
var productos = [];
var carrito = [];
var datosCliente = {};
var metodoPago = '';
var datosTarjeta = {};
var paginaActual = 'pagina-productos';

// ===== Elementos del DOM =====
// Paginas
var paginas = document.querySelectorAll('.pagina');
var barraPasos = document.getElementById('barra-pasos');

// Header
var logoInicio = document.getElementById('logo-inicio');
var btnCarritoHeader = document.getElementById('btn-carrito');
var contadorCarrito = document.getElementById('contador-carrito');

// Panel lateral carrito
var panelCarrito = document.getElementById('panel-carrito');
var btnCerrarPanel = document.getElementById('btn-cerrar-panel');
var panelCarritoLista = document.getElementById('panel-carrito-lista');
var panelCarritoVacio = document.getElementById('panel-carrito-vacio');
var panelCarritoTotal = document.getElementById('panel-carrito-total');
var btnIrCarrito = document.getElementById('btn-ir-carrito');
var overlay = document.getElementById('overlay');

// Pagina productos
var productosGrid = document.getElementById('contenedor-productos');
var cargandoDiv = document.getElementById('cargando');
var filtroBtns = document.querySelectorAll('.filtro-btn');

// Pagina carrito
var carritoTabla = document.getElementById('carrito-tabla');
var carritoPaginaVacio = document.getElementById('carrito-pagina-vacio');
var carritoPaginaFooter = document.getElementById('carrito-pagina-footer');
var carritoPaginaTotal = document.getElementById('carrito-pagina-total');

// Pagina datos
var formDatos = document.getElementById('form-datos');

// Pagina pago
var formPago = document.getElementById('form-pago');
var camposTarjeta = document.getElementById('campos-tarjeta');
var radiosPago = document.querySelectorAll('input[name="metodo-pago"]');

// Pagina confirmacion
var confirmacionProductos = document.getElementById('confirmacion-productos');
var confirmacionTotal = document.getElementById('confirmacion-total');
var confirmacionDatos = document.getElementById('confirmacion-datos');
var confirmacionPago = document.getElementById('confirmacion-pago');

// Pagina exito
var exitoNombre = document.getElementById('exito-nombre');
var exitoDireccion = document.getElementById('exito-direccion');
var exitoTotal = document.getElementById('exito-total');

// =============================================
//  NAVEGACION ENTRE PAGINAS
// =============================================

function navegarA(nombrePagina) {

    // Ocultar todas las paginas
    paginas.forEach(function (pagina) {
        pagina.classList.remove('activa');
    });

    // Mostrar la pagina destino
    var paginaDestino = document.getElementById(nombrePagina);
    if (paginaDestino) {
        paginaDestino.classList.add('activa');
    }

    paginaActual = nombrePagina;

    // Scroll al inicio de la pagina
    window.scrollTo(0, 0);

    // Mostrar u ocultar barra de pasos
    var paginasCheckout = ['pagina-carrito', 'pagina-datos', 'pagina-pago', 'pagina-confirmacion'];
    if (paginasCheckout.indexOf(nombrePagina) !== -1) {
        barraPasos.classList.add('visible');
    } else {
        barraPasos.classList.remove('visible');
    }

    // Actualizar pasos
    actualizarBarraPasos(nombrePagina);

    // Cerrar panel lateral si estaba abierto
    cerrarPanelCarrito();

    // Renderizar contenido segun la pagina
    if (nombrePagina === 'pagina-carrito') {
        renderizarPaginaCarrito();
    } else if (nombrePagina === 'pagina-confirmacion') {
        renderizarPaginaConfirmacion();
    } else if (nombrePagina === 'pagina-pago') {
        actualizarCamposTarjeta();
    }
}

function actualizarBarraPasos(pagina) {
    var pasos = document.querySelectorAll('.paso');
    var lineas = document.querySelectorAll('.paso-linea');

    var mapa = {
        'pagina-carrito': 1,
        'pagina-datos': 2,
        'pagina-pago': 3,
        'pagina-confirmacion': 4
    };

    var pasoActual = mapa[pagina] || 0;

    pasos.forEach(function (paso) {
        var num = parseInt(paso.getAttribute('data-paso'));

        // Resetear clases
        paso.classList.remove('completado', 'activo');

        if (num < pasoActual) {
            paso.classList.add('completado');
        } else if (num === pasoActual) {
            paso.classList.add('activo');
        }
    });

    lineas.forEach(function (linea, i) {
        if (i + 1 < pasoActual) {
            linea.classList.add('completada');
        } else {
            linea.classList.remove('completada');
        }
    });
}

// ===== Click en logo vuelve al inicio =====
logoInicio.addEventListener('click', function () {
    navegarA('pagina-productos');
});

// ===== Click en boton del carrito (header) =====
btnCarritoHeader.addEventListener('click', function () {
    // Si estamos en alguna pagina del checkout, volver a productos
    if (paginaActual !== 'pagina-productos' && paginaActual !== 'pagina-exito') {
        navegarA('pagina-productos');
        return;
    }
    // Si estamos en productos, abrir panel lateral
    abrirPanelCarrito();
});

// =============================================
//  PRODUCTOS
// =============================================

function cargarProductos() {
    fetch('data/products.json')
        .then(function (respuesta) {
            if (!respuesta.ok) {
                throw new Error('Error al cargar productos');
            }
            return respuesta.json();
        })
        .then(function (datos) {
            productos = datos;

            // Ordenar por categoria y luego por precio de menor a mayor
            productos.sort(function (a, b) {
                if (a.categoria < b.categoria) return -1;
                if (a.categoria > b.categoria) return 1;
                return a.precio - b.precio;
            });

            mostrarProductos(productos);
        })
        .catch(function () {
            cargandoDiv.innerHTML = '<p style="color: #e94560;">Error al cargar productos. Reintenta mas tarde.</p>';
        });
}

function mostrarProductos(listaProductos) {

    cargandoDiv.style.display = 'none';

    if (listaProductos.length === 0) {
        productosGrid.innerHTML = '<p class="cargando">No hay productos en esta categoria.</p>';
        return;
    }

    productosGrid.innerHTML = '';

    listaProductos.forEach(function (producto) {
        var card = document.createElement('article');
        card.classList.add('producto-card');

        var stockAgotado = producto.stock === 0;

        card.innerHTML =
            '<div class="producto-icono">' + producto.imagen + '</div>' +
            '<h3 class="producto-nombre">' + producto.nombre + '</h3>' +
            '<p class="producto-descripcion">' + producto.descripcion + '</p>' +
            '<p class="producto-precio">$' + formatearPrecio(producto.precio) + '</p>' +
            '<p class="producto-stock">Stock: ' + producto.stock + ' disponibles</p>' +
            '<button class="btn-agregar" data-id="' + producto.id + '" ' + (stockAgotado ? 'disabled' : '') + '>' +
            (stockAgotado ? 'Sin stock' : 'Agregar al carrito') +
            '</button>';

        productosGrid.appendChild(card);
    });

    // Asignar eventos a los botones de agregar
    var botonesAgregar = document.querySelectorAll('.btn-agregar');
    botonesAgregar.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = parseInt(this.getAttribute('data-id'));
            agregarAlCarrito(id);
        });
    });
}

function formatearPrecio(precio) {
    return precio.toLocaleString('es-AR');
}

// ===== Filtros =====
filtroBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {

        filtroBtns.forEach(function (b) {
            b.classList.remove('activo');
        });
        this.classList.add('activo');

        var categoria = this.getAttribute('data-categoria');

        if (categoria === 'todos') {
            mostrarProductos(productos);
        } else {
            var filtrados = productos.filter(function (producto) {
                return producto.categoria === categoria;
            });
            mostrarProductos(filtrados);
        }
    });
});

// =============================================
//  CARRITO (logica compartida)
// =============================================

function agregarAlCarrito(idProducto) {
    var producto = productos.find(function (p) {
        return p.id === idProducto;
    });

    if (!producto) return;

    var itemEnCarrito = carrito.find(function (item) {
        return item.id === idProducto;
    });

    if (itemEnCarrito) {
        if (itemEnCarrito.cantidad < producto.stock) {
            itemEnCarrito.cantidad++;
        } else {
            mostrarToast('No hay mas stock de ' + producto.nombre, 'error');
            return;
        }
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1,
            stock: producto.stock
        });
    }

    actualizarVistasCarrito();
    mostrarToast(producto.nombre + ' agregado al carrito', 'ok');
}

function cambiarCantidadCarrito(indice, delta) {
    var item = carrito[indice];
    var nuevaCantidad = item.cantidad + delta;

    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(indice);
        return;
    }

    if (nuevaCantidad > item.stock) {
        mostrarToast('Stock maximo: ' + item.stock + ' unidades', 'error');
        return;
    }

    item.cantidad = nuevaCantidad;
    actualizarVistasCarrito();
}

function eliminarDelCarrito(indice) {
    var nombre = carrito[indice].nombre;
    carrito.splice(indice, 1);
    actualizarVistasCarrito();
    mostrarToast(nombre + ' eliminado del carrito', 'info');
}

function vaciarCarrito() {
    if (carrito.length === 0) return;
    carrito = [];
    actualizarVistasCarrito();
    mostrarToast('Carrito vaciado', 'info');
}

function calcularTotalCarrito() {
    return carrito.reduce(function (total, item) {
        return total + (item.precio * item.cantidad);
    }, 0);
}

function calcularCantidadItems() {
    return carrito.reduce(function (total, item) {
        return total + item.cantidad;
    }, 0);
}

function actualizarVistasCarrito() {

    var totalItems = calcularCantidadItems();
    contadorCarrito.textContent = totalItems;

    // Panel lateral
    btnIrCarrito.disabled = carrito.length === 0;

    if (carrito.length === 0) {
        panelCarritoVacio.style.display = 'flex';
        panelCarritoLista.innerHTML = '';
    } else {
        panelCarritoVacio.style.display = 'none';
        renderizarPanelCarrito();
    }

    panelCarritoTotal.textContent = '$' + formatearPrecio(calcularTotalCarrito());

    // Si estamos en la pagina del carrito, actualizarla
    if (paginaActual === 'pagina-carrito') {
        renderizarPaginaCarrito();
    }
}

// =============================================
//  PANEL LATERAL DEL CARRITO
// =============================================

function abrirPanelCarrito() {
    panelCarrito.classList.add('abierto');
    overlay.classList.add('activo');
}

function cerrarPanelCarrito() {
    panelCarrito.classList.remove('abierto');
    overlay.classList.remove('activo');
}

btnCerrarPanel.addEventListener('click', cerrarPanelCarrito);
overlay.addEventListener('click', cerrarPanelCarrito);

btnIrCarrito.addEventListener('click', function () {
    if (carrito.length === 0) return;
    navegarA('pagina-carrito');
});

function renderizarPanelCarrito() {
    panelCarritoLista.innerHTML = '';

    carrito.forEach(function (item, indice) {
        var div = document.createElement('div');
        div.classList.add('carrito-item');

        div.innerHTML =
            '<span class="carrito-item-icono">' + item.imagen + '</span>' +
            '<div class="carrito-item-info">' +
            '<p class="carrito-item-nombre">' + item.nombre + '</p>' +
            '<p class="carrito-item-precio">$' + formatearPrecio(item.precio) + ' c/u</p>' +
            '</div>' +
            '<div class="carrito-item-cantidad">' +
            '<button class="btn-cantidad btn-restar" data-indice="' + indice + '">-</button>' +
            '<span class="cantidad-numero">' + item.cantidad + '</span>' +
            '<button class="btn-cantidad btn-sumar" data-indice="' + indice + '">+</button>' +
            '</div>' +
            '<button class="btn-eliminar" data-indice="' + indice + '" title="Eliminar">🗑️</button>';

        panelCarritoLista.appendChild(div);
    });

    // Binding de eventos del panel
    panelCarritoLista.querySelectorAll('.btn-sumar').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-indice'));
            cambiarCantidadCarrito(i, 1);
        });
    });

    panelCarritoLista.querySelectorAll('.btn-restar').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-indice'));
            cambiarCantidadCarrito(i, -1);
        });
    });

    panelCarritoLista.querySelectorAll('.btn-eliminar').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-indice'));
            eliminarDelCarrito(i);
        });
    });
}

// =============================================
//  PAGINA: CARRITO
// =============================================

function renderizarPaginaCarrito() {

    if (carrito.length === 0) {
        carritoTabla.style.display = 'none';
        carritoPaginaFooter.style.display = 'none';
        carritoPaginaVacio.style.display = 'block';
        return;
    }

    carritoTabla.style.display = 'block';
    carritoPaginaFooter.style.display = 'block';
    carritoPaginaVacio.style.display = 'none';

    // Tabla del carrito
    var html = '<div class="carrito-tabla-header">' +
        '<span></span>' +
        '<span>Producto</span>' +
        '<span>Precio</span>' +
        '<span>Cantidad</span>' +
        '<span>Subtotal</span>' +
        '<span></span>' +
        '</div>';

    carrito.forEach(function (item, indice) {
        var subtotal = item.precio * item.cantidad;

        html += '<div class="carrito-fila">' +
            '<span class="carrito-fila-icono">' + item.imagen + '</span>' +
            '<span class="carrito-fila-nombre">' + item.nombre + '</span>' +
            '<span class="carrito-fila-precio">$' + formatearPrecio(item.precio) + '</span>' +
            '<span class="carrito-fila-cantidad">' +
            '<button class="btn-cantidad btn-restar-carrito" data-indice="' + indice + '">-</button>' +
            '<span class="cantidad-numero">' + item.cantidad + '</span>' +
            '<button class="btn-cantidad btn-sumar-carrito" data-indice="' + indice + '">+</button>' +
            '</span>' +
            '<span class="carrito-fila-subtotal">$' + formatearPrecio(subtotal) + '</span>' +
            '<button class="btn-eliminar btn-eliminar-carrito" data-indice="' + indice + '" title="Eliminar">🗑️</button>' +
            '</div>';
    });

    carritoTabla.innerHTML = html;
    carritoPaginaTotal.textContent = '$' + formatearPrecio(calcularTotalCarrito());

    // Eventos de los botones en la tabla
    carritoTabla.querySelectorAll('.btn-sumar-carrito').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-indice'));
            cambiarCantidadCarrito(i, 1);
        });
    });

    carritoTabla.querySelectorAll('.btn-restar-carrito').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-indice'));
            cambiarCantidadCarrito(i, -1);
        });
    });

    carritoTabla.querySelectorAll('.btn-eliminar-carrito').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var i = parseInt(this.getAttribute('data-indice'));
            eliminarDelCarrito(i);
        });
    });
}

// Botones de la pagina carrito
document.getElementById('btn-ir-datos').addEventListener('click', function () {
    if (carrito.length === 0) {
        mostrarToast('El carrito esta vacio', 'error');
        return;
    }
    navegarA('pagina-datos');
});

document.getElementById('btn-vaciar-carrito').addEventListener('click', function () {
    vaciarCarrito();
});

document.getElementById('btn-volver-productos').addEventListener('click', function () {
    navegarA('pagina-productos');
});

document.getElementById('btn-tienda-desde-vacio').addEventListener('click', function () {
    navegarA('pagina-productos');
});

// =============================================
//  PAGINA: DATOS PERSONALES Y ENVIO
// =============================================

document.getElementById('btn-volver-carrito').addEventListener('click', function () {
    navegarA('pagina-carrito');
});

// ===== Validacion en vivo del email =====
var emailInput = document.getElementById('email-cliente');

emailInput.addEventListener('blur', function () {
    validarEmailEnVivo();
});

emailInput.addEventListener('input', function () {
    // Solo validar si ya se marco como error antes
    if (emailInput.classList.contains('error-input')) {
        validarEmailEnVivo();
    }
});

function validarEmailEnVivo() {
    var email = emailInput.value.trim();

    if (email === '') {
        limpiarErrorCampo('email-cliente');
        return;
    }

    if (email.indexOf('@') === -1 || email.indexOf('.') === -1 || email.indexOf('@') === 0 || email.lastIndexOf('.') < email.indexOf('@') + 2 || email.lastIndexOf('.') === email.length - 1) {
        mostrarErrorCampo('email-cliente', 'Ingresa un correo valido (ej: nombre@mail.com)');
    } else {
        limpiarErrorCampo('email-cliente');
    }
}

// ===== Validacion en vivo del telefono =====
var telefonoInput = document.getElementById('telefono-cliente');

telefonoInput.addEventListener('blur', function () {
    validarTelefonoEnVivo();
});

telefonoInput.addEventListener('input', function () {
    if (telefonoInput.classList.contains('error-input')) {
        validarTelefonoEnVivo();
    }
});

function validarTelefonoEnVivo() {
    var telefono = telefonoInput.value.trim();

    if (telefono === '') {
        limpiarErrorCampo('telefono-cliente');
        return;
    }

    // Permitir numeros, espacios, guiones y parentesis
    var soloDigitos = telefono.replace(/\D/g, '');

    if (soloDigitos.length < 8) {
        mostrarErrorCampo('telefono-cliente', 'El telefono debe tener al menos 8 digitos');
    } else {
        limpiarErrorCampo('telefono-cliente');
    }
}

// ===== Submit del formulario de datos =====
formDatos.addEventListener('submit', function (evento) {
    evento.preventDefault();

    // Obtener valores
    var nombre = document.getElementById('nombre-cliente').value.trim();
    var email = document.getElementById('email-cliente').value.trim();
    var telefono = document.getElementById('telefono-cliente').value.trim();
    var cp = document.getElementById('cp-cliente').value.trim();
    var direccion = document.getElementById('direccion-cliente').value.trim();
    var ciudad = document.getElementById('ciudad-cliente').value.trim();
    var provincia = document.getElementById('provincia-cliente').value;

    // Validacion
    var errores = false;

    if (!nombre) {
        mostrarErrorCampo('nombre-cliente', 'Ingresa tu nombre completo');
        errores = true;
    } else {
        limpiarErrorCampo('nombre-cliente');
    }

    // Validar email
    var emailValido = email !== '' && email.indexOf('@') !== -1 && email.indexOf('.') !== -1 && email.indexOf('@') !== 0 && email.lastIndexOf('.') > email.indexOf('@') + 1 && email.lastIndexOf('.') !== email.length - 1;

    if (!emailValido) {
        mostrarErrorCampo('email-cliente', 'Ingresa un correo valido');
        errores = true;
    } else {
        limpiarErrorCampo('email-cliente');
    }

    // Validar telefono (al menos 8 digitos)
    var soloDigitosTel = telefono.replace(/\D/g, '');
    if (soloDigitosTel.length < 8) {
        mostrarErrorCampo('telefono-cliente', 'El telefono debe tener al menos 8 digitos');
        errores = true;
    } else {
        limpiarErrorCampo('telefono-cliente');
    }

    if (!cp || cp.length < 4) {
        mostrarErrorCampo('cp-cliente', 'Ingresa un codigo postal valido');
        errores = true;
    } else {
        limpiarErrorCampo('cp-cliente');
    }

    if (!direccion) {
        mostrarErrorCampo('direccion-cliente', 'Ingresa tu direccion');
        errores = true;
    } else {
        limpiarErrorCampo('direccion-cliente');
    }

    if (!ciudad) {
        mostrarErrorCampo('ciudad-cliente', 'Ingresa tu ciudad');
        errores = true;
    } else {
        limpiarErrorCampo('ciudad-cliente');
    }

    if (!provincia) {
        mostrarErrorCampo('provincia-cliente', 'Selecciona una provincia');
        errores = true;
    } else {
        limpiarErrorCampo('provincia-cliente');
    }

    if (errores) {
        mostrarToast('Completa todos los campos obligatorios', 'error');
        return;
    }

    // Guardar datos
    datosCliente = {
        nombre: nombre,
        email: email,
        telefono: telefono,
        cp: cp,
        direccion: direccion,
        ciudad: ciudad,
        provincia: provincia
    };

    navegarA('pagina-pago');
});

function mostrarErrorCampo(idCampo, mensaje) {
    var input = document.getElementById(idCampo);
    var errorSpan = input.parentElement.querySelector('.form-error');
    input.classList.add('error-input');
    if (errorSpan) {
        errorSpan.textContent = mensaje;
    }
}

function limpiarErrorCampo(idCampo) {
    var input = document.getElementById(idCampo);
    var errorSpan = input.parentElement.querySelector('.form-error');
    input.classList.remove('error-input');
    if (errorSpan) {
        errorSpan.textContent = '';
    }
}

// =============================================
//  PAGINA: METODO DE PAGO
// =============================================

document.getElementById('btn-volver-datos').addEventListener('click', function () {
    navegarA('pagina-datos');
});

// Mostrar / ocultar campos de tarjeta segun metodo de pago
radiosPago.forEach(function (radio) {
    radio.addEventListener('change', function () {
        actualizarCamposTarjeta();
    });
});

function actualizarCamposTarjeta() {
    var metodoSeleccionado = document.querySelector('input[name="metodo-pago"]:checked');

    if (metodoSeleccionado) {
        var valor = metodoSeleccionado.value;
        if (valor === 'credito' || valor === 'debito') {
            camposTarjeta.style.display = 'block';
        } else {
            camposTarjeta.style.display = 'none';
        }
    }
}

formPago.addEventListener('submit', function (evento) {
    evento.preventDefault();

    var metodoSeleccionado = document.querySelector('input[name="metodo-pago"]:checked');

    if (!metodoSeleccionado) {
        mostrarToast('Selecciona un metodo de pago', 'error');
        return;
    }

    metodoPago = metodoSeleccionado.value;

    // Si es tarjeta, validar campos
    if (metodoPago === 'credito' || metodoPago === 'debito') {
        var numero = document.getElementById('numero-tarjeta').value.trim();
        var vencimiento = document.getElementById('vencimiento-tarjeta').value.trim();
        var cvv = document.getElementById('cvv-tarjeta').value.trim();

        var errores = false;

        if (!numero || numero.replace(/\s/g, '').length < 13) {
            mostrarErrorCampo('numero-tarjeta', 'Ingresa un numero de tarjeta valido');
            errores = true;
        } else {
            limpiarErrorCampo('numero-tarjeta');
        }

        if (!vencimiento || vencimiento.indexOf('/') === -1) {
            mostrarErrorCampo('vencimiento-tarjeta', 'Formato: MM/AA');
            errores = true;
        } else {
            limpiarErrorCampo('vencimiento-tarjeta');
        }

        if (!cvv || cvv.length < 3) {
            mostrarErrorCampo('cvv-tarjeta', 'Ingresa el codigo de seguridad');
            errores = true;
        } else {
            limpiarErrorCampo('cvv-tarjeta');
        }

        if (errores) {
            mostrarToast('Completa los datos de la tarjeta', 'error');
            return;
        }

        datosTarjeta = {
            numero: numero,
            vencimiento: vencimiento,
            cvv: cvv
        };
    }

    navegarA('pagina-confirmacion');
});

// =============================================
//  PAGINA: CONFIRMACION
// =============================================

function renderizarPaginaConfirmacion() {

    // Productos
    var htmlProductos = '';
    carrito.forEach(function (item) {
        var subtotal = item.precio * item.cantidad;

        htmlProductos += '<div class="confirmacion-item">' +
            '<span>' + item.imagen + ' ' + item.nombre + ' x' + item.cantidad + '</span>' +
            '<span>$' + formatearPrecio(subtotal) + '</span>' +
            '</div>';
    });

    confirmacionProductos.innerHTML = htmlProductos;
    confirmacionTotal.textContent = '$' + formatearPrecio(calcularTotalCarrito());

    // Datos de envio
    confirmacionDatos.innerHTML =
        '<p><strong>Nombre:</strong> ' + datosCliente.nombre + '</p>' +
        '<p><strong>Email:</strong> ' + datosCliente.email + '</p>' +
        '<p><strong>Telefono:</strong> ' + datosCliente.telefono + '</p>' +
        '<p><strong>Direccion:</strong> ' + datosCliente.direccion + '</p>' +
        '<p><strong>Ciudad:</strong> ' + datosCliente.ciudad + ', ' + datosCliente.provincia + '</p>' +
        '<p><strong>Codigo postal:</strong> ' + datosCliente.cp + '</p>';

    // Metodo de pago
    var textoPago = '';
    switch (metodoPago) {
        case 'credito':
            textoPago = 'Tarjeta de credito (terminada en ' + datosTarjeta.numero.slice(-4) + ')';
            break;
        case 'debito':
            textoPago = 'Tarjeta de debito (terminada en ' + datosTarjeta.numero.slice(-4) + ')';
            break;
        case 'transferencia':
            textoPago = 'Transferencia bancaria';
            break;
        case 'efectivo':
            textoPago = 'Efectivo contra entrega';
            break;
        default:
            textoPago = metodoPago;
    }

    confirmacionPago.innerHTML = '<p><strong>' + textoPago + '</strong></p>';
}

document.getElementById('btn-volver-pago').addEventListener('click', function () {
    navegarA('pagina-pago');
});

document.getElementById('btn-confirmar-pedido').addEventListener('click', function () {

    var total = calcularTotalCarrito();

    // Armar datos de la pagina de exito
    exitoNombre.textContent = datosCliente.nombre;
    exitoDireccion.textContent = datosCliente.direccion + ', ' + datosCliente.ciudad + ', ' + datosCliente.provincia + ' (CP ' + datosCliente.cp + ')';
    exitoTotal.textContent = '$' + formatearPrecio(total);

    // Limpiar carrito
    carrito = [];
    actualizarVistasCarrito();

    // Mostrar pagina de exito
    navegarA('pagina-exito');

    // Mostrar toast
    mostrarToast('Pedido confirmado con exito', 'ok');
});

// =============================================
//  PAGINA: EXITO
// =============================================

document.getElementById('btn-volver-inicio').addEventListener('click', function () {
    // Resetear datos
    datosCliente = {};
    metodoPago = '';
    datosTarjeta = {};

    navegarA('pagina-productos');
});

// =============================================
//  TOASTS (libreria Toastify)
// =============================================

function mostrarToast(mensaje, tipo) {
    var colores = {
        ok: '#4caf50',
        error: '#e94560',
        info: '#0f3460'
    };

    Toastify({
        text: mensaje,
        duration: 2500,
        gravity: 'bottom',
        position: 'right',
        style: {
            background: colores[tipo] || colores.info
        }
    }).showToast();
}

// =============================================
//  INICIALIZAR
// =============================================

cargarProductos();
