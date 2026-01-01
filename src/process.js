import ps from 'ps-node';

export function killDiscord() {
    return new Promise((resolve, reject) => {
        ps.lookup({ command: 'Discord' }, (err, resultList) => {
            if (err) return resolve(false);

            const pids = resultList.map(p => p.pid);
            if (pids.length === 0) return resolve(true);

            pids.forEach(pid => {
                try { process.kill(pid); } catch (e) { }
            });

            setTimeout(() => resolve(true), 1500);
        });
    });
}
