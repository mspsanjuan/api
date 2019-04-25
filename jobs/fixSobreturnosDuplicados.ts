import * as agendasModel from './../modules/turnos/schemas/agenda';

async function run(done) {
    let pipeline = [];
    // Ojo cambiar la fecha
    let desde = new Date(2019, 3, 22);
    let cantidadAgendas = 0;
    let cantidadUpdeteados = 0;
    pipeline = [
        {
            $match: {
                estado: { $in: ['publicada', 'pendienteAsistencia', 'pendienteAuditoria'] }, 'sobreturnos.updatedAt': { $gte: desde }
            }
        },
        {
            $project: {
                sobreturnos: 1, sobreturnosSize: { $size: '$sobreturnos' }
            }
        },
        {
            $match: {
                sobreturnosSize: { $gt: 10 }
            }
        }
    ];
    try {
        let agendas = await agendasModel.aggregate(pipeline);
        cantidadAgendas = agendas.length;
        if (agendas) {
            agendas.forEach(async ag => {
                let salida = [];
                let idAgenda = ag._id;
                let sobreturnos = ag.sobreturnos;
                sobreturnos.forEach(st => {
                    let foundIndex = salida.findIndex(s => s.paciente.documento === st.paciente.documento);
                    if (foundIndex < 0) {
                        salida.push(st);
                    } else {
                        if (st.asistencia && !salida[foundIndex].asistencia) {
                            salida[foundIndex] = st;
                        }
                    }
                });
                let myAgenda: any = await agendasModel.findById(idAgenda);
                myAgenda.sobreturnos = [...salida];
                await myAgenda.save();
                cantidadUpdeteados++;
                if (cantidadAgendas === cantidadUpdeteados) {
                    done();
                }
            });
        }
    } catch (error) {
        return (done(error));
    }
}
export = run;

