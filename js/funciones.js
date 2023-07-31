//variables
let listaCarrito = [];
let banderaForm = true;
let banderaPago = true;
let totalProd = 0.0;

let mensaje = "";
let datosCliente = [];
let icono = "";
let mensajeTost = "";
let timerTost = 0;

let pedidoListo = false;
let clienteCargado = false;

let datosClie = [];
let listaProd = [];

const dateTime = luxon.DateTime;

// Elementos del DOM
const cardProd = document.querySelector("#productosCarrito");
const mostrarCarrito = document.getElementById("carrito");
const modalCarrito = document.getElementById("modalCarrito");

const contadorCarrito = document.getElementById("contadorCarrito");
const btnGuardarCliente = document.querySelector("#btnGuardarCli");
const btnConfirmar = document.getElementById("btnConfirmar");

const frmCliente = document.querySelector(".frm-Cliente");
const inputNombreCliente = document.getElementById("nombreCliente");
const inputDomicilio = document.getElementById("domicilio");
const inputTelefono = document.getElementById("telefono");

//promesas
fetch("../listaProductos.json")
  .then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(console.log("Error en la conexión: " + response.status));
    }
  })
  .then((lista) => {
    //console.log(lista); control para ver lo que se obtiene del JSON

    lista.forEach((prod) => {
      let item = document.createElement("div");
      item.className = "card";
      item.innerHTML = `
      <img src="${prod.imagen}">
      <h3>${prod.nombre}</h3>
      <p class="precio">$ ${prod.precio}</p>
      `;

      cardProd.append(item);

      let btnAgregar = document.createElement("button");
      btnAgregar.innerText = "+ Agregar";
      btnAgregar.className = "btnAgregar";

      item.append(btnAgregar);

      btnAgregar.addEventListener("click", (e) => {
        e.preventDefault();

        const contProducto = listaCarrito.some(
          (contarProd) => contarProd.id === prod.id
        );

        if (contProducto) {
          listaCarrito.map((product) => {
            if (product.id === prod.id) {
              product.cantidad++;
            }
          });
        } else {
          listaCarrito.push({
            id: prod.id,
            imagen: prod.imagen,
            nombre: prod.nombre,
            precio: prod.precio,
            cantidad: prod.cantidad,
          });
        }
        //se llama a la funcion contar productos y los muestra en el carrito
        contadorProduct();
        calculoTotal();
        guardarCarritoStorage();
        tostadaSwal("success", "Se agregó un nuevo ítem al carrito", 1000);
        pedidoListo = false;
      });
    });
  })
  .catch((err) => {
    mensaje = "Error en la conexión al servidor";
    tostadaSwal("error", mensaje, 4000);
  });

//eventos

mostrarCarrito.addEventListener("click", () => {
  carrito();
});

// Eventos de botones

btnGuardarCliente.addEventListener("click", (e) => {
  e.preventDefault();
  //console.log("entro al evento guardar")
  guardarCliente();
});

btnConfirmar.addEventListener("click", (e) => {
  e.preventDefault();
  confirmarPedido();
  //pagoPedido();
});

//funciones

// funcion de llenado de carrito

function carrito() {
  modalCarrito.innerHTML = ``;
  modalCarrito.style.display = "flex";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";
  modalHeader.innerHTML = `
  <h1 class="modal-header-tittle">Lista de Pedido</h1>
  `;
  modalCarrito.append(modalHeader);

  const modalButton = document.createElement("h2");
  modalButton.innerText = "X";
  modalButton.className = "modal-button-x";

  modalButton.addEventListener("click", (e) => {
    e.preventDefault();
    modalCarrito.style.display = "none";
  });

  modalHeader.append(modalButton);

  listaCarrito.forEach((prod) => {
    let modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalBody.innerHTML = `
    
    <img src="${prod.imagen}">
    <p>${prod.nombre}</p>
    <p>$ ${prod.precio}</p>
    <p class="restarProd"><strong>-</strong></p>
    <p>Cantidad: <strong>${prod.cantidad}</strong></p>
    <p class="sumarProd"><strong>+</strong></p>
    <p>Sub-Total: ${prod.precio * prod.cantidad}</p>
    <button class="btnQuitar">QUITAR</button>`;

    modalCarrito.append(modalBody);

    const sumarProd = modalBody.querySelector(".sumarProd");
    const restarProd = modalBody.querySelector(".restarProd");

    // se restan productos al carrito

    restarProd.addEventListener("click", () => {
      if (prod.cantidad !== 1) {
        prod.cantidad--;
      }
      //se muestra de nuevo el carrrito
      carrito();
      guardarCarritoStorage();
    });

    //se agregan productos al carrito
    sumarProd.addEventListener("click", () => {
      prod.cantidad++;

      //se muestra de nuevo el carrrito
      carrito();
      guardarCarritoStorage();
    });

    let quitar = modalBody.querySelector(".btnQuitar");
    quitar.addEventListener("click", () => {
      eliminarProducto(prod.id);
    });
  });

  calculoTotal();

  const totalCompra = document.createElement("div");
  totalCompra.className = "total-compra";
  totalCompra.innerHTML = `TOTAL...: $ ${totalProd}`;

  modalCarrito.append(totalCompra);

  const btnFinPedido = document.createElement("button");
  btnFinPedido.className = "btn-FinPedido";
  btnFinPedido.innerText = "Finalizar Pedido";

  totalCompra.append(btnFinPedido);

  totalCompra.addEventListener("click", (e) => {
    e.preventDefault();
    controlPedido();
  });

  btnFinPedido.onclick = () => {
    inputNombreCliente.focus();
  };
  guardarCarritoStorage();
}

// función para contar los productos y mostrar la cantidad  en el carrito.
contadorProduct = () => {
  contadorCarrito.style.display = "block";
  contadorCarrito.innerText = listaCarrito.length;
};

calculoTotal = () => {
  totalProd = listaCarrito.reduce(
    (acumulador, elemento) => acumulador + elemento.precio * elemento.cantidad,
    0
  );
};

//funcion para eliminar un producto del carrito.

eliminarProducto = (idEliminar) => {
  //se guarda en una variable el valor encontrado
  const index = listaCarrito.find((element) => element.id === idEliminar);

  listaCarrito = listaCarrito.filter((idCarrito) => {
    return idCarrito !== index;
  });

  // se completa nuevamente el carrito.-
  carrito();
  // se actualiza el valor que se muestra
  contadorProduct();
};

// control de pedido

function controlPedido() {
  Swal.fire({
    //position: 'top-end',
    icon: "success",
    title: "SE ESTÁ PREPARANDO EL PEDIDO",
    html:'<strong>"Completar los datos para el envío!"</strong>',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1800,
  });
  modalCarrito.style.display = "none";
  pedidoListo = true;
}

function pagoPedido() {
  let timerInterval;
  Swal.fire({
    title: "Pago del pedido",
    html: "dirigiendose a plataforma de pago...<b></b> milisegundos.",
    timer: 2500,
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
      const b = Swal.getHtmlContainer().querySelector("b");
      timerInterval = setInterval(() => {
        b.textContent = Swal.getTimerLeft();
      }, 100);
    },
    willClose: () => {
      clearInterval(timerInterval);
      limpiarLocalStorage();
      eventos();
      location.reload();
    },
  }).then((result) => {
    if (result.dismiss === Swal.DismissReason.timer) {
      console.log("Se ha redireccionado el pago a la plataforma MP.");
    }
  });
  

  
  
}



const continuarPago = () => {
  recuperarStorage();

  //spread
  const cli = [...datosCli];

  //fecha con luxon
  const fecha = dateTime.now();
  fecha.toLocaleString(dateTime.DATETIME_MED_WITH_WEEKDAY);
 

  Swal.fire({
    title: "¿Confirmar el Pedido?",
    html:`<p>Pedido Burg's Store: #34 </br>
    <p>Fecha: ${fecha} </p></br>
    <p>Cliente:<strong> ${cli[0]}</strong></p></br>
    <p>Domicilio de Entrega:<strong> ${cli[1]}</strong></p></br>
    <p>Teléfono: <strong>${cli[2]}</strong></p></br>
    <hr>
    <p>Total a pagar:<strong> $${totalProd}.-</strong></p>
    <hr>
    <p><strong>---MUCHAS GRACIAS POR SU COMPRA---</strong></p>
    `,
    showDenyButton: true,
    confirmButtonText: "Ir a Pagar",
    confirmButtonColor: "#3085d6",
    denyButtonText: `Me Arrepiento`,
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: "Pedido Confirmado...",
        icon: "success",
      });
      pagoPedido();
      

    } else if (result.isDenied) {
      Swal.fire({
        title: "Peido Cancelado",
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
      pedidoListo = false;
    }
  });
};

const validarForm = () => {
  if (inputNombreCliente.value === "") {
    inputNombreCliente.classList.remove("txtBien");
    inputNombreCliente.classList.add("txtMal");
    banderaForm = false;
    tostadaSwal("error", "Falta completar un campo", 2000);
    inputNombreCliente.focus();
  } else {
    inputNombreCliente.classList.remove("txtMal");
    inputNombreCliente.classList.add("txtBien");
  }

  if (inputDomicilio.value === "") {
    inputDomicilio.classList.remove("txtBien");
    inputDomicilio.classList.add("txtMal");
    banderaForm = false;
    tostadaSwal("error", "Falta completar un campo", 2000);
    inputDomicilio.focus();
  } else {
    inputDomicilio.classList.remove("txtMal");
    inputDomicilio.classList.add("txtBien");
  }

  if (inputTelefono.value === "") {
    inputTelefono.classList.remove("txtBien");
    inputTelefono.classList.add("txtMal");
    banderaForm = false;
    tostadaSwal("error", "Falta completar un campo", 2000);
    inputTelefono.focus();
  } else {
    inputTelefono.classList.remove("txtMal");
    inputTelefono.classList.add("txtBien");
  }

  if (banderaForm) {
    btnConfirmar.focus();
  }

  return banderaForm;
};

function guardarCliente() {
  frmCliente.addEventListener("submit", validarForm);
  if (validarForm()) {
    datosCliente.push(
      inputNombreCliente.value,
      inputDomicilio.value,
      inputTelefono.value
    );
    tostadaSwal("success", "Datos del envío correctos!", 2000);
    //se guarda en el storage
    guardarClienteStorage();
    //se asigna un valor vacío al array para luego recuperar correctamente del storage
    clienteCargado = true;
    datosCliente = [];
  } else {
    banderaForm = true;
  }
}


confirmarPedido = () => {
  const pedido = pedidoListo === true ? true : false;
  pedido ? controlClienteCarga() : tostadaSwal("error", "Debe FINZALIZAR EL PEDIDO en el Carrito. ", 2500);

};

const controlClienteCarga = ()=>{
  const clienteOK = clienteCargado === true ? true : false;
  clienteOK ? continuarPago() : tostadaSwal("error", "Aún NO está Cargado el Cliente", 2000);
}


// función genérica de tostada
function tostadaSwal(icono, mensajeTost, timerTost) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: timerTost,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: icono,
    title: mensajeTost,
  });
}

function limpiarFrm(f) {
  f.reset();
}

function limpiarLocalStorage() {
  localStorage.clear();
}

function eventos() {
  document.addEventListener("DOMContentLoaded", recuperarStorage);
}

//manejo de localStorage

function guardarCarritoStorage() {
  if (listaCarrito === []) {
    localStorage.setItem("listaCarr", JSON.stringify(listaCarrito));
    localStorage.setItem("totalProd", JSON.stringify(totalProd));
  } else {
    localStorage.removeItem("listaCarr", JSON.stringify(listaCarrito));
    localStorage.setItem("listaCarr", JSON.stringify(listaCarrito));

    localStorage.removeItem("totalProd", JSON.stringify(totalProd));
    localStorage.setItem("totalProd", JSON.stringify(totalProd));
  }
}

function guardarClienteStorage() {
  if (datosCliente === []) {
    localStorage.setItem("datosCli", JSON.stringify(datosCliente));
  } else {
    localStorage.removeItem("datosCli", JSON.stringify(datosCliente));
    localStorage.setItem("datosCli", JSON.stringify(datosCliente));
  }
  limpiarFrm(frmCliente);
}

function recuperarStorage() {
  listaProd = JSON.parse(localStorage.getItem("listaCarr")) || [];
  totalProd = JSON.parse(localStorage.getItem("totalProd")) || 0;
  
  
  listaCarrito = listaProd; 
  datosCli = JSON.parse(localStorage.getItem("datosCli")) || "";
  if (datosCli !== "") {
    //desestructuración de array
    const [nom, dom, tel] = datosCli;
    inputNombreCliente.value = nom;
    inputDomicilio.value = dom;
    inputTelefono.value = tel;
    clienteCargado = true;
  }
  

  if (listaCarrito.length !== 0) {
    contadorProduct();
  }
}

eventos();
