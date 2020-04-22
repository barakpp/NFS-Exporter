const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const df = require('node-df');
const _ = require('lodash');

const PATH_TO_MONITOR = process.env.PATH_TO_MONITOR;

const MP4_EXT = '.mp4';
const TS_EXT = '.ts';


function getDiskSpace() {
    let diskUsage;
    let options = {
        prefixMultiplier: 'GB',
        precision: 2
    };

    return new Promise((resolve, reject) => {
        return df(options, (error, response) => {
            if (error) {
                reject(error);
            }
            diskUsage = _.map(response, disk => {
                disk.usePrecents = (disk.used / disk.size) * 100;
                return disk;

            });
            resolve(diskUsage);
        });
    });
}


function countFilesFromFolder() {
    return getDirectories()
        .then(directories => {
            if (directories) {
                return getFilesFromDirs(directories);
            }
        })
        .catch(err => {
            console.log(`Failed to get directories with error ${err}`);
        });
}

function getFilesFromDirs(dirs) {
    let result = {};
    return Promise.map(dirs, dir => {
        if (dir) {
            result[dir] = { mp4Counter: 0, tsCounter: 0 };
            return fs.readdir(dir)
                .then(files => {
                    return Promise.map(files, file => {
                        return fs.stat(path.join(dir, file))
                            .then(stat => {
                                if (stat.isFile()) {
                                    if (path.extname(file) == MP4_EXT) {
                                        result[dir].mp4Counter++;
                                    }
                                    else if (path.extname(file) == TS_EXT) {
                                        result[dir].tsCounter++;
                                    }
                                }
                            })
                    })
                })
        }
    }).then(() => {
        return result;
    });
}

function getDirectories() {

    return fs.readdir(PATH_TO_MONITOR)
        .then(dirs => {
            return Promise.map(dirs, dir => {
                return fs.stat(PATH_TO_MONITOR + dir)
                    .then(stat => {
                        return stat.isDirectory() ? PATH_TO_MONITOR + dir : null;
                    })
            });

        })
        .catch(err => {
            console.log(`Error while getting directories with error ${err}`);
        });
}

exports.countFilesFromFolder = countFilesFromFolder;
exports.getDiskSpace = getDiskSpace;
