
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

app.get('/metrics', async (req, res) => {
    await getMetrics();
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
});


async function getMetrics() {
    let diskUsage;
    let directories;

    try {
        diskUsage = await getDiskSpace();
    }
    catch (err) {
        console.log(`Failed to extact disk usage with error ${err}`);
    }

    directories = countFilesFromFolder();

    if (directories) {
        Object.keys(directories).forEach(dir => {
            nfsFolderMp4Gauge.set({ directory: dir }, directories[dir].mp4Counter);
            nfsFolderTsGauge.set({ directory: dir }, directories[dir].tsCounter);
        });
    }
    if (diskUsage) {
        diskUsage.forEach(disk => {
            nfDiskUsageAvailableGauge.set({ filesystem: disk.filesystem }, disk.usePrecents);
        });
    }
}

app.listen(PORT, () => {
    console.log(`Start listening to port ${PORT}`);
});