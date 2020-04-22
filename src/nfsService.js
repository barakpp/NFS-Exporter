require('dotenv').config();

const { statSync, readdirSync } = require('fs');
const path = require('path');
const df = require('node-df');

const PATH_TO_MONITOR = process.env.PATH_TO_MONITOR;

const MP4_EXT = '.mp4';
const TS_EXT = '.ts';


function getDiskSpace() {
    let diskUsage = [];

    return new Promise((resolve, reject) => {
        return df((error, response) => {
            if (error) {
                reject(error);
            }
            response.forEach(disk => {
                disk.usePrecents = (disk.used / disk.size) * 100;
                disk.available = disk.available / 1000;
                disk.size = disk.size / 1000;
                disk.used = disk.used / 1000;
                diskUsage.push(disk);
            });
            resolve(diskUsage);
        });
    });
}


function countFilesFromFolder() {
    let directories = getDirectories();

    if (directories) {
        return getFilesFromDirs(directories);
    }
    return null;
}

function getFilesFromDirs(dirs) {
    let dirFileAndSubDirs;
    let result = {};

    dirs.forEach(dir => {
        try {
            result[dir] = { mp4Counter: 0, tsCounter: 0 };
            dirFileAndSubDirs = readdirSync(dir);

            dirFileAndSubDirs.forEach(subDirOrFile => {
                if (statSync(path.join(dir, subDirOrFile)).isFile()) {
                    if (path.extname(subDirOrFile) == MP4_EXT) {
                        result[dir].mp4Counter++;
                    }
                    else if (path.extname(subDirOrFile) == TS_EXT) {
                        result[dir].tsCounter++;
                    }
                }
            });
        }
        catch (error) {
            console.log(`Failed to extact files from folders with error: ${error}`);
            return null;
        }
    });
    return result;
}

function getDirectories() {
    let dirFileAndSubDirs;
    let dirs = [];

    try {
        dirFileAndSubDirs = readdirSync(PATH_TO_MONITOR);
    }
    catch (error) {
        console.log(`Failed to extact directories from the given path with error ${error}`);
        return null;
    }

    dirFileAndSubDirs.forEach(subDirOrFile => {
        statSync(PATH_TO_MONITOR + subDirOrFile).isDirectory() ? dirs.push(path.join(PATH_TO_MONITOR, subDirOrFile)) : null;
    });
    return dirs;
}

exports.countFilesFromFolder = countFilesFromFolder;
exports.getDiskSpace = getDiskSpace;
