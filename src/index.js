
require('dotenv').config();

const express = require('express');
const { Gauge, register } = require('prom-client');
const { countFilesFromFolder, getDiskSpace } = require('./nfsService');
const Promise = require('bluebird');

const PORT = process.env.PORT || 5555;
const PATH_TO_MONITOR = process.env.PATH_TO_MONITOR || "/mnt/devContent/";

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

const nfsFolderSizeGauge = new Gauge({
    name: 'nfs_folder_size',
    help: 'size of the folder in GB',
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
            res.set('Content-Type', register.contentType);
            res.status(500).send(`Internal server error: ${err.message}`);
        });
});


function getMetrics() {
    return Promise.all([getDiskSpace(), countFilesFromFolder(PATH_TO_MONITOR)])
        .spread((diskUsage, directories) => {
            if (diskUsage) {
                diskUsage.forEach(disk => {
                    nfDiskUsageAvailableGauge.set({ filesystem: disk.filesystem }, disk.usePrecents);
                });
            }
            if (directories) {
                directories.forEach(dir => {
                    Object.keys(dir).forEach(dirName => {
                        // nfsFolderMp4Gauge.set({ directory: dirName }, dir[dirName].mp4Counter);
                        // nfsFolderTsGauge.set({ directory: dirName }, dir[dirName].tsCounter);
                        nfsFolderSizeGauge.set({ directory: dirName }, dir[dirName].size);
                    });
                });
            }
        })
        .catch(err => {
            console.log(`Failed to get metrics with error ${err}`);
            return Promise.reject(err);
        });
}

app.listen(PORT, () => {
    console.log(`Start listening to port ${PORT}`);
});
