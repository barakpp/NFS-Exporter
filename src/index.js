
require('dotenv').config();

const express = require('express');
const { Gauge, register } = require('prom-client');
const { countFilesFromFolder, getDiskSpace } = require('./nfsService');

const PORT = process.env.PORT || 5555;


const nfsFolderTsGauge = new Gauge({
    name: 'nfs_folder_ts_files',
    help: 'number of ts files in the folder',
    labelNames: ['directory']
});

const nfsFolderMp4Gauge = new Gauge({
    name: 'nfs_folder_mp4_files',
    help: 'number of mp4 files in the folder',
    labelNames: ['directory']
});

const nfDiskUsageAvailableGauge = new Gauge({
    name: 'nfs_diskusage',
    help: 'usage of a disk in % units',
    labelNames: ['filesystem']
});

const app = express();

app.get('/metrics', (req, res) => {
    getMetrics()
        .then(() => {
            res.set('Content-Type', register.contentType);
            res.end(register.metrics());
        })
        .catch(err => {
            console.log(`Error while getting the metrics with error ${err}`);
        });
});


function getMetrics() {
    return new Promise((resolve, reject) => {
        return getDiskSpace()
            .then(diskUsageRespone => {
                if (diskUsageRespone) {
                    diskUsageRespone.forEach(disk => {
                        nfDiskUsageAvailableGauge.set({ filesystem: disk.filesystem }, disk.usePrecents);
                    });
                }
                return countFilesFromFolder()
                    .then(directories => {
                        if (directories) {
                            Object.keys(directories).forEach(dir => {
                                nfsFolderMp4Gauge.set({ directory: dir }, directories[dir].mp4Counter);
                                nfsFolderTsGauge.set({ directory: dir }, directories[dir].tsCounter);
                            });
                        }
                        resolve();
                    })
            })
            .catch(err => {
                reject(err);
            });
    })
}

app.listen(PORT, () => {
    console.log(`Start listening to port ${PORT}`);
});