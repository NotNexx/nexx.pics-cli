import fs from "fs";

export async function promptAndDetectFilesByPrefix(prefix: string = ""): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir("./", (err, files) => {
            if (err) {
                reject(err);
                return;
            }

            const matchingFiles = files.filter((file) => file.startsWith(prefix));
            resolve(matchingFiles);
        });
    });
}
