const Promise = require('bluebird');
const path = require('path');
const df = require('node-df');
const Filehoud = require('filehound');
const _ = require('lodash');

const DISK_PREFIX_MULTIPLIER = process.env.DISK_PREFIX_MULTIPLIER || 'GB';

const MP4_EXT = '.mp4';
const TS_EXT = '.ts';

function getDiskSpace() {
    let diskUsage;
    let options = {
        prefixMultiplier: DISK_PREFIX_MULTIPLIER,
        precision: 2
    };

    return new Promise((resolve, reject) => {
        return df(options, (error, response) => {
            if (error) {
                return reject(error);
            }
            diskUsage = _.map(response, disk => {
                disk.usePrecents = (disk.used / disk.size) * 100;
                return disk;
            });
            resolve(diskUsage);
        });
    });
}

function countFilesFromFolder(pathToMonitor) {
    let result = {};
    let fileExt;
    let seperatedPath;
    let captureName;

    return Filehoud.create()
        .path(pathToMonitor)
        .ext([MP4_EXT, TS_EXT])
        .find()
        .then(filesPath => {
            filesPath.filter(file => file.includes('capture'))
                .forEach(capturePath => {
                    fileExt = path.extname(capturePath);
                    seperatedPath = capturePath.split(path.sep);
                    [captureName] = seperatedPath.filter(file => file.includes('capture'));
                    _.isUndefined(result[captureName]) ? result[captureName] = { mp4Counter: 0, tsCounter: 0 } : null;

                    fileExt == MP4_EXT ? result[captureName].mp4Counter++ : null;
                    fileExt == TS_EXT ? result[captureName].tsCounter++ : null;
                });
            return result;
        })
        .catch(err => {
            return Promise.reject(err);
        });

}
// function countFilesFromFolder() {
//     return getDirectories(PATH_TO_MONITOR)
//         .then(directories => {

//             if (directories) {
//                 return getFilesFromDirs(directories);
//             }
//         })
//         .catch(err => {
//             console.log(`Failed to get directories with error ${err}`);
//         });
// }

// function getFilesFromDirs(dirs) {
//     let result = {};

//     return Promise.map(dirs, dir => {
//         if (dir) {
//             result[dir] = { mp4Counter: 0, tsCounter: 0 };
//             return fs.readdir(dir)
//                 .then(files => {
//                     return Promise.map(files, file => {
//                         return getStat(path.join(dir, file))
//                             .then(fileExt => {
//                                 fileExt == MP4_EXT ? result[dir].mp4Counter++ : null;
//                                 fileExt == TS_EXT ? result[dir].tsCounter++ : null;
//                             });
//                     })
//                 })
//         }
//     }).then(() => {
//         return result;
//     })
//         .catch(err => {
//             console.log(`Failed to get files from dirs with error ${err}`);
//         });
// }

// function getStat(filePath) {
//     return fs.stat(filePath)
//         .then(stat => {
//             if (stat.isFile()) {
//                 if (path.extname(filePath) == MP4_EXT) {
//                     return MP4_EXT;
//                 }
//                 else if (path.extname(filePath) == TS_EXT) {
//                     return TS_EXT;
//                 }
//                 return null
//             }
//             return null;
//         })
// }

// function getDirectories(dirPath) { // requrc
//     return fs.readdir(dirPath)
//         .then(dirs => {
//             return Promise.map(dirs, dir => {
//                 return fs.stat(path.join(dirPath + dir))
//                     .then(stat => {
//                         if (stat.isDirectory()) {
//                             return getDirectories(path.join(dirPath + dir + '/'));
//                         }
//                     })

//             });

//         })
//         .catch(err => {
//             console.log(`Error while getting directories with error ${err}`);
//         });
// }

exports.countFilesFromFolder = countFilesFromFolder;
exports.getDiskSpace = getDiskSpace;
