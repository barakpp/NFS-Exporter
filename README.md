# NFS-Exporter

NFS-Exporter is a prometheus exporter for monitoring a givven path, the exporters monitors the following:
* Number of MP4 files in all sub-directories for a given path.
* Number of TS files in all sub-directories for a given path.
* File system usage.

# Installation

Clone this project to your machine and then install the dependencies.

```bash
git clone https://github.com/barakpp/NFS-Exporter.git 
cd NFS-Exporter
npm i
```

# Output Example

```
# HELP nfs_folder_ts_files number of ts files in the folder
# TYPE nfs_folder_ts_files gauge
nfs_folder_ts_files{directory="/mnt/devContent/c1"} 1
nfs_folder_ts_files{directory="/mnt/devContent/c2"} 2


# HELP nfs_folder_mp4_files number of mp4 files in the folder
# TYPE nfs_folder_mp4_files gauge
nfs_folder_mp4_files{directory="/mnt/devContent/c1"} 1
nfs_folder_mp4_files{directory="/mnt/devContent/c2"} 7

# HELP nfs_diskusage usage of a disk in % units
# TYPE nfs_diskusage gauge
nfs_diskusage{filesystem="udev"} 0
nfs_diskusage{filesystem="tmpfs"} 0
nfs_diskusage{filesystem="/dev/sda1"} 59.9806514027733
nfs_diskusage{filesystem="/dev/sr0"} 100
```
