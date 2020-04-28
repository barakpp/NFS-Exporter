const Promise = require('bluebird');
const path = require('path');
const moment = require('moment');
const fse = require('fs-extra');
const df = require('node-df');
const Filehoud = require('filehound');
const _ = require('lodash');

const DISK_PREFIX_MULTIPLIER = process.env.DISK_PREFIX_MULTIPLIER || 'GB';

const MP4_EXT = '.mp4';
const TS_EXT = '.ts';
const FILE_PATH = './last-results.json';

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

function dirSearch(dirPath) {
    let dirName = path.basename(dirPath);
    let result = {};

    _.isUndefined(result[dirName]) ? result[dirName] = { mp4Counter: 0, tsCounter: 0, totalSize: 0 } : null;

    return Filehoud.create()
        .includeFileStats()
        .path(dirPath)
        .ext([MP4_EXT, TS_EXT])
        .find()
        .then(filesPath => {
            filesPath.forEach(filesPath => {
                fileExt = path.extname(filesPath.path);
                result[dirName].totalSize += (filesPath.stats.size / 1000000000);
                fileExt == MP4_EXT ? result[dirName].mp4Counter++ : null;
                fileExt == TS_EXT ? result[dirName].tsCounter++ : null;
            });
            return Promise.resolve(result);
        })
}

function countFilesFromFolder(pathToMonitor) {
    let results = [];
    let resultsToFile = {};


    return fse.readJSON(FILE_PATH)
        .then(fileContent => {
            let lastRequest = fileContent.lastRequest;
            let lastResults = fileContent.results;

            if (moment(moment().diff(lastRequest, 'seconds')) > 10) {
                Filehoud.create()
                    .path(pathToMonitor)
                    .directory()
                    .depth(0)
                    .find()
                    .then(directories => {
                        Promise.each(directories, dir => {
                            return dirSearch(dir)
                                .then(res => results.push(res));
                        }).then(() => {
                            resultsToFile = {
                                lastRequest: moment(),
                                results: results
                            }
                            fse.ensureFileSync(FILE_PATH);
                            fse.writeJSONSync(FILE_PATH, resultsToFile);
                        })
                    });
            }
            return Promise.resolve(lastResults);
        })
        .catch(err => {
            if (err.code === 'ENOENT') {
                fse.ensureFileSync(FILE_PATH);
                fse.writeJSONSync(FILE_PATH, { lastRequest: moment() });
            }
        })
}

exports.countFilesFromFolder = countFilesFromFolder;
exports.getDiskSpace = getDiskSpace;
