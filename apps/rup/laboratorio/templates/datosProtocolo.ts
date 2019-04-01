
export const datosProtocoloHTML = `<style>
    table { width: 100%; }
    table thead th { text-align: left; }
    table.datosProtocolo { border:  1px solid #000; border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    table.datosProtocolo td { border-left: 1px solid #000; width: 50%; }
    table.datosProtocolo td:first-child { border-left: none; }
    table.datosProtocolo td div { margin-left: 10px; }
</style>
<table class='datosProtocolo' >
    <tbody>
        <tr>
            <td>
                <div>
                    <span><b><!-- paciente.apellido, paciente.nombre --></b></span><br/>
                    <span>DU: <!-- paciente.documento --></span><br/>
                    <span>Fecha Nac: <!-- paciente.fechaNacimiento --></span><br/>
                    <span>Edad: <!-- paciente.edad --></span><br/>
                    <span>Sexo: <!-- paciente.sexo --></span>
                </div>

            </td>
            <td>
                <div>
                    <span>Protocolo Nro. <!-- solicitud.registros[0].valor.solicitudPrestacion.numeroProtocolo.numeroCompleto --></span><br />
                    <span>Fecha: <!-- ejecucion.fecha --></span><br/>
                    <span>Solicitante: <!-- solicitud.profesional.apellido, solicitud.profesional.nombre --></span><br/>
                    <span>Sector: <!-- solicitud.registros[0].valor.solicitudPrestacion.servicio.term --></span><br/>
                    <span>Origen: <!-- solicitud.ambitoOrigen --></span><br/>
                </div>
            </td>
        </tr>
    </tbody>
</table>
<table>
    <thead>
        <th>PRÁCTICA</th>
        <th>VALOR HALLADO</th>
        <th>VALORES DE REFERENCIA</th>
        <th>MÉTODO</th>
        <th>FIRMA ELECTRÓNICA</th>
    </thead>
    <tbody>`;
