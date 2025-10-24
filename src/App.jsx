import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

function App() {
  const [compras, setCompras] = useState([])
  const [ventas, setVentas] = useState([])
  const [mesDeclaracion, setMesDeclaracion] = useState('')
  const [nombreCliente, setNombreCliente] = useState('')
  const [cedulaJuridica, setCedulaJuridica] = useState('')
  const [actividad, setActividad] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Formulario Compras
  const [numFacturaCompra, setNumFacturaCompra] = useState('')
  const [fechaCompra, setFechaCompra] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [montoCompra, setMontoCompra] = useState('')
  const [tasaIvaCompra, setTasaIvaCompra] = useState('13')
  const [tipoCompra, setTipoCompra] = useState('local')

  // Formulario Ventas
  const [numFacturaVenta, setNumFacturaVenta] = useState('')
  const [fechaVenta, setFechaVenta] = useState('')
  const [cliente, setCliente] = useState('')
  const [montoVenta, setMontoVenta] = useState('')
  const [tasaIvaVenta, setTasaIvaVenta] = useState('13')
  const [tipoVenta, setTipoVenta] = useState('local')

  // Inicializar mes actual
  useEffect(() => {
    const hoy = new Date()
    const mesActual = hoy.toISOString().split('T')[0].substring(0, 7)
    setMesDeclaracion(mesActual)
    setFechaCompra(hoy.toISOString().split('T')[0])
    setFechaVenta(hoy.toISOString().split('T')[0])
  }, [])

  const getPeriodoText = () => {
    if (!mesDeclaracion) return ''
    const [año, m] = mesDeclaracion.split('-')
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return `${meses[parseInt(m) - 1]} ${año}`
  }

  const mostrarMensajeExito = (mensaje) => {
    setSuccessMessage(mensaje)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const importarVentas = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      alert('Por favor selecciona un archivo de ventas')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result)
          const wb = XLSX.read(data, { cellDates: true, defval: '' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 })

          let contadoAgregado = 0
          const nuevasVentas = []

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i]
            if (!row || row.length === 0) continue

            const fecha = row[0]
            const numeroDoc = row[1]
            const clienteNombre = row[4]
            const montoVenta = parseFloat(row[14]) || 0
            const ivaVenta = parseFloat(row[17]) || 0

            let tasaIva = 0
            if (ivaVenta > 0 && montoVenta > 0) {
              tasaIva = Math.round((ivaVenta / montoVenta) * 100)
            }

            if (fecha && numeroDoc && clienteNombre && montoVenta > 0) {
              let fechaFormato = fecha
              if (typeof fecha === 'number') {
                fechaFormato = XLSX.SSF.format('yyyy-mm-dd', fecha)
              } else if (fecha instanceof Date) {
                fechaFormato = fecha.toISOString().split('T')[0]
              }

              nuevasVentas.push({
                numFactura: numeroDoc.toString(),
                fecha: fechaFormato,
                cliente: clienteNombre.toString(),
                monto: montoVenta,
                tasa: tasaIva,
                iva: ivaVenta,
                tipo: 'importado'
              })
              contadoAgregado++
            }
          }

          if (contadoAgregado > 0) {
            setVentas(prev => [...prev, ...nuevasVentas])
            mostrarMensajeExito(`Se importaron ${contadoAgregado} ventas correctamente`)
          } else {
            alert('No se encontraron ventas válidas en el archivo')
          }
        } catch (error) {
          alert('Error procesando archivo: ' + error.message)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      alert('Error al cargar archivo: ' + error.message)
    }
  }

  const importarCompras = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      alert('Por favor selecciona un archivo de compras')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result)
          const wb = XLSX.read(data, { cellDates: true, defval: '' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' })

          let contadoAgregado = 0
          const nuevasCompras = []

          jsonData.forEach((row) => {
            if (!row['Fecha'] || !row['No. Documento']) return

            const fecha = row['Fecha']
            const numeroDoc = row['No. Documento']
            const proveedorNombre = row['Proveedor'] || ''
            const subtotal = parseFloat(row['SubTotal']) || 0
            const impuestos = parseFloat(row['Impuestos']) || 0

            if (numeroDoc && proveedorNombre && subtotal > 0) {
              let fechaFormato = fecha
              if (typeof fecha === 'number') {
                fechaFormato = XLSX.SSF.format('yyyy-mm-dd', fecha)
              } else if (fecha instanceof Date) {
                fechaFormato = fecha.toISOString().split('T')[0]
              }

              const tasaIva = impuestos > 0 ? 13 : 0
              nuevasCompras.push({
                numFactura: numeroDoc.toString(),
                fecha: fechaFormato,
                proveedor: proveedorNombre,
                monto: subtotal,
                tasa: tasaIva,
                iva: impuestos,
                tipo: 'importado'
              })
              contadoAgregado++
            }
          })

          if (contadoAgregado > 0) {
            setCompras(prev => [...prev, ...nuevasCompras])
            mostrarMensajeExito(`Se importaron ${contadoAgregado} compras correctamente`)
          } else {
            alert('No se encontraron compras válidas en el archivo')
          }
        } catch (error) {
          alert('Error procesando archivo: ' + error.message)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      alert('Error al cargar archivo: ' + error.message)
    }
  }

  const agregarCompra = () => {
    if (!numFacturaCompra || !fechaCompra || !proveedor || !montoCompra || parseFloat(montoCompra) === 0) {
      alert('Por favor completa todos los campos')
      return
    }

    const monto = parseFloat(montoCompra)
    const tasa = parseFloat(tasaIvaCompra)
    const iva = (monto * tasa) / 100

    setCompras([...compras, {
      numFactura: numFacturaCompra,
      fecha: fechaCompra,
      proveedor,
      monto,
      tasa,
      iva,
      tipo: tipoCompra
    }])

    setNumFacturaCompra('')
    setProveedor('')
    setMontoCompra('')
  }

  const agregarVenta = () => {
    if (!numFacturaVenta || !fechaVenta || !cliente || !montoVenta || parseFloat(montoVenta) === 0) {
      alert('Por favor completa todos los campos')
      return
    }

    const monto = parseFloat(montoVenta)
    const tasa = parseFloat(tasaIvaVenta)
    const iva = (monto * tasa) / 100

    setVentas([...ventas, {
      numFactura: numFacturaVenta,
      fecha: fechaVenta,
      cliente,
      monto,
      tasa,
      iva,
      tipo: tipoVenta
    }])

    setNumFacturaVenta('')
    setCliente('')
    setMontoVenta('')
  }

  const eliminarCompra = (index) => {
    setCompras(compras.filter((_, i) => i !== index))
  }

  const eliminarVenta = (index) => {
    setVentas(ventas.filter((_, i) => i !== index))
  }

  const limpiarTodo = () => {
    if (confirm('¿Estás seguro de que deseas eliminar todos los registros?')) {
      setCompras([])
      setVentas([])
      setNombreCliente('')
      setCedulaJuridica('')
      setActividad('')
    }
  }

  const descargarExcelOVI = () => {
    const wb = XLSX.utils.book_new()

    const totalIvaCobrado = ventas.reduce((sum, v) => sum + v.iva, 0)
    const totalIvaDeducible = compras.reduce((sum, c) => sum + c.iva, 0)
    const ivaAPagar = totalIvaCobrado - totalIvaDeducible

    const wsResumen = XLSX.utils.aoa_to_sheet([
      ['DECLARACIÓN DE IVA - RÉGIMEN TRADICIONAL'],
      [''],
      ['Información del Declarante'],
      ['Cliente:', nombreCliente],
      ['Cédula Jurídica:', cedulaJuridica],
      ['Actividad:', actividad],
      ['Período:', getPeriodoText()],
      [''],
      ['RESUMEN DE IVA PARA OVI'],
      ['Concepto', 'Monto'],
      ['IVA Cobrado en Ventas', totalIvaCobrado.toFixed(2)],
      ['IVA Deducible en Compras', totalIvaDeducible.toFixed(2)],
      ['IVA A Pagar / Acreditar', ivaAPagar.toFixed(2)]
    ])
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen")

    const comprasData = [
      ['COMPRAS - FORMATO OVI'],
      ['Número de Factura', 'Fecha', 'Proveedor', 'Subtotal (Base Imponible)', 'Tasa IVA %', 'IVA Deducible', 'Total con IVA']
    ]
    let totalComprasConIva = 0
    compras.forEach(c => {
      const totalConIva = c.monto + c.iva
      totalComprasConIva += totalConIva
      comprasData.push([c.numFactura, c.fecha, c.proveedor, c.monto.toFixed(2), c.tasa, c.iva.toFixed(2), totalConIva.toFixed(2)])
    })
    comprasData.push(['TOTAL', '', '', compras.reduce((s, c) => s + c.monto, 0).toFixed(2), '', compras.reduce((s, c) => s + c.iva, 0).toFixed(2), totalComprasConIva.toFixed(2)])
    const wsCompras = XLSX.utils.aoa_to_sheet(comprasData)
    XLSX.utils.book_append_sheet(wb, wsCompras, "Compras")

    const ventasData = [
      ['VENTAS - FORMATO OVI'],
      ['Número de Factura', 'Fecha', 'Cliente', 'Subtotal (Base Imponible)', 'Tasa IVA %', 'IVA Cobrado', 'Total con IVA']
    ]
    let totalVentasConIva = 0
    ventas.forEach(v => {
      const totalConIva = v.monto + v.iva
      totalVentasConIva += totalConIva
      ventasData.push([v.numFactura, v.fecha, v.cliente, v.monto.toFixed(2), v.tasa, v.iva.toFixed(2), totalConIva.toFixed(2)])
    })
    ventasData.push(['TOTAL', '', '', ventas.reduce((s, v) => s + v.monto, 0).toFixed(2), '', ventas.reduce((s, v) => s + v.iva, 0).toFixed(2), totalVentasConIva.toFixed(2)])
    const wsVentas = XLSX.utils.aoa_to_sheet(ventasData)
    XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas")

    const nombreArchivo = `Control_IVA_OVI_${nombreCliente || 'Cliente'}_${mesDeclaracion}.xlsx`
    XLSX.writeFile(wb, nombreArchivo)
  }

  const imprimirDeclaracion = () => {
    window.print()
  }

  const totalMontoCompras = compras.reduce((sum, c) => sum + c.monto, 0)
  const totalIvaDeducible = compras.reduce((sum, c) => sum + c.iva, 0)
  const totalMontoVentas = ventas.reduce((sum, v) => sum + v.monto, 0)
  const totalIvaCobrado = ventas.reduce((sum, v) => sum + v.iva, 0)
  const ivaAPagar = totalIvaCobrado - totalIvaDeducible

  return (
    <div className="container">
      <h1>📋 Control de IVA - Declaración OVI</h1>
      <p className="subtitle">Régimen Tradicional - Costa Rica 🇨🇷 | Período: <span>{getPeriodoText()}</span></p>

      {successMessage && (
        <div className="success-box">
          <strong>✅ {successMessage}</strong>
        </div>
      )}

      <div className="info-box">
        <strong>💡 Nota:</strong> Este archivo te ayuda a organizar tus compras y ventas antes de presentar en OVI. Verifica que los montos coincidan con tu sistema de facturación.
      </div>

      {/* SECCIÓN INFORMACIÓN GENERAL */}
      <div className="form-section">
        <h2>Información de la Declaración</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Mes de la Declaración</label>
            <input
              type="month"
              value={mesDeclaracion}
              onChange={(e) => setMesDeclaracion(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Nombre del Cliente</label>
            <input
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Ej: Mi Negocio S.A."
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Cédula Jurídica</label>
            <input
              type="text"
              value={cedulaJuridica}
              onChange={(e) => setCedulaJuridica(e.target.value)}
              placeholder="Ej: 3-101-123456"
            />
          </div>
          <div className="form-group">
            <label>Actividad Económica</label>
            <input
              type="text"
              value={actividad}
              onChange={(e) => setActividad(e.target.value)}
              placeholder="Ej: Venta de Productos"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN IMPORTAR DATOS */}
      <div className="import-section">
        <h2 style={{color: '#2c5aa0', marginBottom: '10px'}}>📥 IMPORTAR DATOS DE ARCHIVOS EXCEL</h2>
        <p style={{marginBottom: '15px', color: '#555'}}>Carga tus archivos de ventas y compras para procesarlos automáticamente</p>
        <div className="import-buttons">
          <div style={{flex: 1, minWidth: '200px'}}>
            <label htmlFor="fileVentas" style={{fontWeight: 'bold', color: '#2c5aa0', marginBottom: '8px', display: 'block'}}>Archivo de Ventas</label>
            <input
              type="file"
              id="fileVentas"
              accept=".xlsx,.xls"
              onChange={importarVentas}
              style={{marginBottom: '10px'}}
            />
          </div>
          <div style={{flex: 1, minWidth: '200px'}}>
            <label htmlFor="fileCompras" style={{fontWeight: 'bold', color: '#2c5aa0', marginBottom: '8px', display: 'block'}}>Archivo de Compras</label>
            <input
              type="file"
              id="fileCompras"
              accept=".xlsx,.xls"
              onChange={importarCompras}
              style={{marginBottom: '10px'}}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN COMPRAS */}
      <div className="form-section">
        <h2>📥 Registro de COMPRAS (IVA Deducible)</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Número de Factura</label>
            <input
              type="text"
              value={numFacturaCompra}
              onChange={(e) => setNumFacturaCompra(e.target.value)}
              placeholder="Ej: 001-001-000123"
            />
          </div>
          <div className="form-group">
            <label>Fecha de Compra</label>
            <input
              type="date"
              value={fechaCompra}
              onChange={(e) => setFechaCompra(e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Proveedor</label>
            <input
              type="text"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Nombre del proveedor"
            />
          </div>
          <div className="form-group">
            <label>Monto Total (sin IVA)</label>
            <input
              type="number"
              value={montoCompra}
              onChange={(e) => setMontoCompra(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tasa IVA (%)</label>
            <select value={tasaIvaCompra} onChange={(e) => setTasaIvaCompra(e.target.value)}>
              <option value="13">13%</option>
              <option value="1">1%</option>
              <option value="0">Exento</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tipo de Compra</label>
            <select value={tipoCompra} onChange={(e) => setTipoCompra(e.target.value)}>
              <option value="local">Compra Local</option>
              <option value="importacion">Importación</option>
              <option value="servicio">Servicio</option>
            </select>
          </div>
        </div>
        <button onClick={agregarCompra}>➕ Agregar Compra Manual</button>
      </div>

      {/* TABLA COMPRAS */}
      <div className="table-container">
        <h3 style={{marginBottom: '10px'}}>Detalle de Compras (<span>{compras.length}</span> registros)</h3>
        <table>
          <thead>
            <tr>
              <th>Factura</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Monto Compra</th>
              <th>Tasa IVA</th>
              <th>IVA Deducible</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c, i) => (
              <tr key={i}>
                <td>{c.numFactura}</td>
                <td>{c.fecha}</td>
                <td>{c.proveedor}</td>
                <td className="currency">₡ {c.monto.toFixed(2)}</td>
                <td>{c.tasa}%</td>
                <td className="currency">₡ {c.iva.toFixed(2)}</td>
                <td>
                  <button
                    className="danger"
                    onClick={() => eliminarCompra(i)}
                    style={{padding: '5px 10px', fontSize: '11px'}}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background: '#e8f4f8', fontWeight: 'bold'}}>
              <td colSpan="3">TOTALES COMPRAS</td>
              <td className="currency">₡ {totalMontoCompras.toFixed(2)}</td>
              <td></td>
              <td className="currency" style={{background: '#fff3cd'}}>₡ {totalIvaDeducible.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* SECCIÓN VENTAS */}
      <div className="form-section">
        <h2>📤 Registro de VENTAS (IVA Cobrado)</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Número de Factura</label>
            <input
              type="text"
              value={numFacturaVenta}
              onChange={(e) => setNumFacturaVenta(e.target.value)}
              placeholder="Ej: 001-001-000456"
            />
          </div>
          <div className="form-group">
            <label>Fecha de Venta</label>
            <input
              type="date"
              value={fechaVenta}
              onChange={(e) => setFechaVenta(e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Cliente</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>
          <div className="form-group">
            <label>Monto Total (sin IVA)</label>
            <input
              type="number"
              value={montoVenta}
              onChange={(e) => setMontoVenta(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tasa IVA (%)</label>
            <select value={tasaIvaVenta} onChange={(e) => setTasaIvaVenta(e.target.value)}>
              <option value="13">13%</option>
              <option value="1">1%</option>
              <option value="0">Exento</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tipo de Venta</label>
            <select value={tipoVenta} onChange={(e) => setTipoVenta(e.target.value)}>
              <option value="local">Venta Local</option>
              <option value="exportacion">Exportación</option>
              <option value="exenta">Venta Exenta</option>
            </select>
          </div>
        </div>
        <button onClick={agregarVenta}>➕ Agregar Venta Manual</button>
      </div>

      {/* TABLA VENTAS */}
      <div className="table-container">
        <h3 style={{marginBottom: '10px'}}>Detalle de Ventas (<span>{ventas.length}</span> registros)</h3>
        <table>
          <thead>
            <tr>
              <th>Factura</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Monto Venta</th>
              <th>Tasa IVA</th>
              <th>IVA Cobrado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v, i) => (
              <tr key={i}>
                <td>{v.numFactura}</td>
                <td>{v.fecha}</td>
                <td>{v.cliente}</td>
                <td className="currency">₡ {v.monto.toFixed(2)}</td>
                <td>{v.tasa}%</td>
                <td className="currency">₡ {v.iva.toFixed(2)}</td>
                <td>
                  <button
                    className="danger"
                    onClick={() => eliminarVenta(i)}
                    style={{padding: '5px 10px', fontSize: '11px'}}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background: '#e8f4f8', fontWeight: 'bold'}}>
              <td colSpan="3">TOTALES VENTAS</td>
              <td className="currency">₡ {totalMontoVentas.toFixed(2)}</td>
              <td></td>
              <td className="currency" style={{background: '#fff3cd'}}>₡ {totalIvaCobrado.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* RESUMEN Y CÁLCULO */}
      <div className="summary-box">
        <h3 style={{color: '#1a3d5c', marginBottom: '15px'}}>📊 RESUMEN DE IVA</h3>
        <div className="summary-row">
          <span>IVA Cobrado en Ventas:</span>
          <strong className="currency">₡ {totalIvaCobrado.toFixed(2)}</strong>
        </div>
        <div className="summary-row">
          <span>IVA Deducible en Compras:</span>
          <strong className="currency negative">₡ {totalIvaDeducible.toFixed(2)}</strong>
        </div>
        <div className="summary-row total-row">
          <span>{ivaAPagar >= 0 ? 'IVA A PAGAR:' : 'IVA A ACREDITAR:'}</span>
          <strong
            className={`currency ${ivaAPagar > 0 ? 'positive' : ivaAPagar < 0 ? 'negative' : ''}`}
            style={{fontSize: '18px'}}
          >
            ₡ {Math.abs(ivaAPagar).toFixed(2)}
          </strong>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="action-buttons">
        <button onClick={descargarExcelOVI}>📥 Descargar Excel (Formato OVI)</button>
        <button onClick={imprimirDeclaracion}>🖨️ Imprimir</button>
        <button className="danger" onClick={limpiarTodo}>🗑️ Limpiar Todo</button>
      </div>
    </div>
  )
}

export default App
