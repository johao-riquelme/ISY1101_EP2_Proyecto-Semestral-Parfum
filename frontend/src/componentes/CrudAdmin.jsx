import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_VENTAS = "/api/v1/ventas";
const API_DESPACHOS = "/api/v1/despachos";

const ventaInicial = {
  nombreCliente: "",
  perfume: "",
  marca: "",
  familiaOlfativa: "",
  concentracion: "Eau de Parfum",
  mililitros: 100,
  cantidad: 1,
  direccionCompra: "",
  valorCompra: 0,
  fechaCompra: new Date().toISOString().slice(0, 10),
  despachoGenerado: false,
};

function formatoPrecio(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

export const CrudAdmin = () => {
  const [ventas, setVentas] = useState([]);
  const [despachos, setDespachos] = useState([]);
  const [formVenta, setFormVenta] = useState(ventaInicial);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const ventasPendientes = useMemo(
    () => ventas.filter((venta) => !venta.despachoGenerado),
    [ventas]
  );

  const cargarDatos = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [ventasResponse, despachosResponse] = await Promise.all([
        axios.get(API_VENTAS),
        axios.get(API_DESPACHOS),
      ]);
      setVentas(ventasResponse.data);
      setDespachos(despachosResponse.data);
    } catch (error) {
      console.error(error);
      setMensaje("No se pudieron cargar los datos. Revisa backend, puertos y base de datos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const actualizarCampo = (event) => {
    const { name, value } = event.target;
    setFormVenta((actual) => ({
      ...actual,
      [name]: ["mililitros", "cantidad", "valorCompra"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const crearVenta = async (event) => {
    event.preventDefault();
    setMensaje("");
    try {
      await axios.post(API_VENTAS, formVenta);
      setFormVenta(ventaInicial);
      setMensaje("Venta de perfume registrada correctamente.");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo registrar la venta. Revisa los campos obligatorios.");
    }
  };

  const generarDespacho = async (venta) => {
    const codigo = `MA-${venta.idVenta}-${Date.now().toString().slice(-4)}`;
    const despacho = {
      fechaDespacho: new Date().toISOString().slice(0, 10),
      transportista: "Aura Express",
      codigoSeguimiento: codigo,
      intento: 0,
      idCompra: venta.idVenta,
      direccionCompra: venta.direccionCompra,
      valorCompra: venta.valorCompra,
      estado: "Pendiente",
      despachado: false,
    };

    try {
      await axios.post(API_DESPACHOS, despacho);
      await axios.put(`${API_VENTAS}/${venta.idVenta}`, {
        ...venta,
        despachoGenerado: true,
      });
      setMensaje(`Despacho generado para la venta #${venta.idVenta}.`);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo generar el despacho.");
    }
  };

  const cerrarDespacho = async (despacho) => {
    try {
      await axios.put(`${API_DESPACHOS}/${despacho.idDespacho}`, {
        ...despacho,
        intento: Number(despacho.intento || 0) + 1,
        estado: "Entregado",
        despachado: true,
      });
      setMensaje(`Despacho #${despacho.idDespacho} marcado como entregado.`);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo cerrar el despacho.");
    }
  };

  return (
    <main className="min-h-screen bg-[#120f18] text-stone-100">
      <section className="bg-gradient-to-r from-[#20152f] via-[#2a183f] to-[#4b263a] border-b border-[#d9b26f]/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="uppercase tracking-[0.35em] text-xs text-[#d9b26f] font-semibold">
            Sistema semestral DevOps · AWS EC2 · Docker · GitHub Actions
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-black text-white">
            Parfum Perfumería Gabriel Espinosa
          </h1>
          <p className="mt-3 max-w-3xl text-stone-300">
            Gestión de ventas y despachos de perfumes. El frontend se publica en EC2-Web,
            los microservicios de ventas y despachos operan en EC2-App y MySQL se mantiene
            en EC2-Data con usuario alumno.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="rounded-3xl bg-[#1d1825] border border-[#d9b26f]/20 p-6 shadow-2xl">
          <p className="text-sm text-stone-400">Ventas registradas</p>
          <h2 className="text-4xl font-black text-[#f4d08a]">{ventas.length}</h2>
          <p className="text-sm text-stone-400 mt-2">Pedidos de perfumes en base de datos</p>
        </article>
        <article className="rounded-3xl bg-[#1d1825] border border-[#d9b26f]/20 p-6 shadow-2xl">
          <p className="text-sm text-stone-400">Pendientes de despacho</p>
          <h2 className="text-4xl font-black text-[#f4d08a]">{ventasPendientes.length}</h2>
          <p className="text-sm text-stone-400 mt-2">Ventas listas para generar envío</p>
        </article>
        <article className="rounded-3xl bg-[#1d1825] border border-[#d9b26f]/20 p-6 shadow-2xl">
          <p className="text-sm text-stone-400">Despachos creados</p>
          <h2 className="text-4xl font-black text-[#f4d08a]">{despachos.length}</h2>
          <p className="text-sm text-stone-400 mt-2">Seguimiento logístico de perfumería</p>
        </article>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-10 grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <form onSubmit={crearVenta} className="rounded-3xl bg-[#f7efe3] text-[#241526] p-6 shadow-2xl border border-[#d9b26f]/30">
          <h2 className="text-2xl font-black">Registrar venta de perfume</h2>
          <p className="text-sm text-stone-600 mt-1">Formulario conectado al microservicio de ventas.</p>

          <div className="grid grid-cols-1 gap-4 mt-6">
            <input name="nombreCliente" value={formVenta.nombreCliente} onChange={actualizarCampo} required placeholder="Cliente: Camila Torres" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]" />
            <input name="perfume" value={formVenta.perfume} onChange={actualizarCampo} required placeholder="Perfume: Aura Nocturne" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]" />
            <input name="marca" value={formVenta.marca} onChange={actualizarCampo} required placeholder="Marca: Parfum" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]" />
            <div className="grid grid-cols-2 gap-3">
              <input name="familiaOlfativa" value={formVenta.familiaOlfativa} onChange={actualizarCampo} placeholder="Familia: Amaderada" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]" />
              <select name="concentracion" value={formVenta.concentracion} onChange={actualizarCampo} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]">
                <option>Eau de Toilette</option>
                <option>Eau de Parfum</option>
                <option>Parfum</option>
                <option>Extrait</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input name="mililitros" type="number" min="1" value={formVenta.mililitros} onChange={actualizarCampo} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]" />
              <input name="cantidad" type="number" min="1" value={formVenta.cantidad} onChange={actualizarCampo} className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]" />
              <input name="valorCompra" type="number" min="1" value={formVenta.valorCompra} onChange={actualizarCampo} placeholder="Precio" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]" />
            </div>
            <input name="direccionCompra" value={formVenta.direccionCompra} onChange={actualizarCampo} required placeholder="Dirección de entrega" className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]" />
            <input name="fechaCompra" type="date" value={formVenta.fechaCompra} onChange={actualizarCampo} required className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#8d5a2b]" />
          </div>

          <button type="submit" className="mt-6 w-full rounded-2xl bg-[#2a183f] hover:bg-[#4b263a] text-white py-3 font-bold transition">
            Crear venta
          </button>
          <button type="button" onClick={cargarDatos} className="mt-3 w-full rounded-2xl border border-[#2a183f] text-[#2a183f] py-3 font-bold hover:bg-white transition">
            {cargando ? "Cargando..." : "Actualizar panel"}
          </button>
          {mensaje && <p className="mt-4 text-sm font-semibold text-[#4b263a]">{mensaje}</p>}
        </form>

        <div className="space-y-6">
          <section className="rounded-3xl bg-[#1d1825] border border-[#d9b26f]/20 p-6 shadow-2xl overflow-x-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-black text-white">Pedidos pendientes</h2>
                <p className="text-sm text-stone-400">Ventas de perfumes disponibles para generar despacho.</p>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-[#f4d08a] border-b border-[#d9b26f]/20">
                <tr>
                  <th className="py-3 pr-4">ID</th>
                  <th className="py-3 pr-4">Cliente</th>
                  <th className="py-3 pr-4">Perfume</th>
                  <th className="py-3 pr-4">Formato</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {ventasPendientes.map((venta) => (
                  <tr key={venta.idVenta} className="border-b border-white/5">
                    <td className="py-4 pr-4">#{venta.idVenta}</td>
                    <td className="py-4 pr-4">{venta.nombreCliente}</td>
                    <td className="py-4 pr-4">{venta.perfume}<br /><span className="text-stone-400">{venta.marca}</span></td>
                    <td className="py-4 pr-4">{venta.concentracion} · {venta.mililitros} ml</td>
                    <td className="py-4 pr-4">{formatoPrecio(venta.valorCompra)}</td>
                    <td className="py-4 pr-4">
                      <button onClick={() => generarDespacho(venta)} className="rounded-full bg-[#d9b26f] text-[#241526] px-4 py-2 font-bold hover:bg-[#f4d08a] transition">
                        Generar despacho
                      </button>
                    </td>
                  </tr>
                ))}
                {ventasPendientes.length === 0 && (
                  <tr><td colSpan="6" className="py-6 text-stone-400">No hay ventas pendientes de despacho.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="rounded-3xl bg-[#1d1825] border border-[#d9b26f]/20 p-6 shadow-2xl overflow-x-auto">
            <h2 className="text-2xl font-black text-white">Despachos Parfum</h2>
            <p className="text-sm text-stone-400 mb-4">Microservicio de despachos en puerto 8081.</p>
            <table className="w-full text-left text-sm">
              <thead className="text-[#f4d08a] border-b border-[#d9b26f]/20">
                <tr>
                  <th className="py-3 pr-4">ID</th>
                  <th className="py-3 pr-4">Venta</th>
                  <th className="py-3 pr-4">Transportista</th>
                  <th className="py-3 pr-4">Código</th>
                  <th className="py-3 pr-4">Estado</th>
                  <th className="py-3 pr-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {despachos.map((despacho) => (
                  <tr key={despacho.idDespacho} className="border-b border-white/5">
                    <td className="py-4 pr-4">#{despacho.idDespacho}</td>
                    <td className="py-4 pr-4">Venta #{despacho.idCompra}<br /><span className="text-stone-400">{despacho.direccionCompra}</span></td>
                    <td className="py-4 pr-4">{despacho.transportista}</td>
                    <td className="py-4 pr-4">{despacho.codigoSeguimiento}</td>
                    <td className="py-4 pr-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${despacho.despachado ? "bg-green-300 text-green-950" : "bg-yellow-200 text-yellow-950"}`}>{despacho.estado}</span></td>
                    <td className="py-4 pr-4">
                      {!despacho.despachado && (
                        <button onClick={() => cerrarDespacho(despacho)} className="rounded-full bg-[#4b263a] text-white px-4 py-2 font-bold hover:bg-[#6e3556] transition">
                          Marcar entregado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {despachos.length === 0 && (
                  <tr><td colSpan="6" className="py-6 text-stone-400">No hay despachos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </section>
    </main>
  );
};
