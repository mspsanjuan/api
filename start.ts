let production = process.env.NODE_ENV === 'production';
import * as cluster from 'cluster';

const stopSignals = [
    'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
];


let stopping = false;

cluster.on('disconnect', function (worker) {
    if (production) {
        if (!stopping) {
            cluster.fork();
        }
    } else {
        process.exit(1);
    }
});
// Listen for dying workers
cluster.on('exit', function (worker) {
    // Replace the dead worker, we're not sentimental
    cluster.fork();
});

if (cluster.isMaster) {

    if (!production) {
        // tslint:disable-next-line:no-console
        console.log(`
                                      -\/+ossssso+\/\`
                                     -os\/-.\` \`os+:ss:
                                    \/s+\`    \`os:  \`+y+
                                   \/s+     \`os:     +y\/
                                  \/s+      +ss+     \`oy:
                                 :s+      \/s\/+s:     \`ss.
                                -so\`     -so\`\`ss.     -yo\`
                               .so.     \`ss.  -so\`     \/y\/
                              \`os-      +s:    \/s\/     \`oy-
                             \`+s:      :s+     \`os-     .ys\`
                    \`        \/s\/      -so\`      .ss\`     \/y+
                 .\/+++:\`    \/s\/      \`os.        \/y\/     \`oy-
               .\/+:.\`-+o:\` :s+\`     \`+s:         \`os-     .ss\`              \`\`...-..\`\`
             .\/+:\`    \`:o+\/s+\`      +s\/           -ss\`     :yo         \`-\/++oooo\/\/\/\/\/\/\/.
           .:\/-\`        .oso\`     \`+s\/             \/y+      oy:       -os\/-..:+o\/.  \`\`:+\/.
        \`.::-\`           \`\/s+.   .+s:              \`oy-     \`sy.     :so.    \`+o\/o\/\`   \`\/+-
      \`.--.\`               -+o+\/+s+.                .ss.     -ys\`   \/s+\`    \`+o- .\/+:\`   -\/\/.
     \`\`\`\`                    .-:-.                   -yo\`     :yo\` :yo\`     +o-    -++:\`  \`:\/:-\`\`
                                                      \/y+      \/yo:ys\`     \/s\/       .\/+\/-...:\/\/\/::--.\`\`
                                                       +y+      :yys\`     \/s\/          \`.-:::::--..\`
                                                        +y+\`    \/ys.    .+s:
                                                         :ss:-:oy+\`\`.-:os+.
                                                          \`:+ossyyyss+\/-\`
        `);
    }

    var workerCount = process.env.NODE_CLUSTER_WORKERS || require('os').cpus().length;
    // Starting ${workerCount} workers...
    for (var i = 0; i < workerCount; i++) {
        cluster.fork();
    }
    if (production) {
        stopSignals.forEach(function (signal) {
            process.on(signal, function () {
                // Got ${signal}, stopping workers...
                stopping = true;
                cluster.disconnect(function () {
                    // All workers stopped, exiting.
                    process.exit(0);
                });
            });
        });
    }
} else {
    require('./index.js');
}
