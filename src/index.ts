import inquirer from "inquirer";
import clipboardy from "clipboardy";

import JsonUtil from "./utils/jsonUtil.js";
import { createShort, remove, upload } from "./utils/apiUtil.js";
import { promptAndDetectFilesByPrefix } from './utils/detectionUtil.js';


let config = JsonUtil.readConfig();
let authKey = config ? config.authKey : "";

if (!authKey) {
    const authKeyPrompt = await inquirer.prompt([
        {
            type: "password",
            name: "authKey",
            message: "Please input your nexx.pics authentication key:",
            mask: "*",
        },
    ]);

    authKey = authKeyPrompt.authKey;

    JsonUtil.writeConfig({ authKey });
}


async function main() {
    await promptAndDetectFilesByPrefix();
    let continueMenu = true;

    while (continueMenu) {
        const servicePrompt = await inquirer.prompt([
            {
                type: "list",
                name: "serviceToUse",
                message: "What do you want to do on nexx.pics?",
                choices: [
                    "Upload files",
                    "Delete files",
                    "Create Short",
                    "Delete Short",
                    "Exit",
                ],
            },
        ]);

        const serviceToUse = servicePrompt.serviceToUse;

        switch (serviceToUse) {
            case "Upload files":
                await uploadFile();
                break;
            case "Delete files":
                await deleteFile();
                break;
            case "Create Short":
                await createURL();
                break;
            case "Delete Short":
                await deleteURL();
                break;
            case "Exit":
                continueMenu = false;
                console.log("Exiting...");
                break;
            default:
                console.log("Something went wrong!");
                break;
        }
    }
}

async function uploadFile() {
    const fileNames = await promptAndDetectFilesByPrefix();
    if (fileNames.length === 0) {
        console.log("No matching files found.");
        return;
    }

    const filePrompt = await inquirer.prompt([
        {
            type: "list",
            name: "selectedFile",
            message: "Please select the file you want to upload:",
            choices: fileNames,
        },
    ]);

    const selectedFile = filePrompt.selectedFile;
    const filePath = `./${selectedFile}`;

    try {
        const response = await upload(filePath, authKey);

        const uploads = JsonUtil.readUploads() || { uploads: [] };
        uploads.uploads.push({ filename: selectedFile, deletionUrl: response.deletionUrl });
        JsonUtil.createUploads(uploads);

        console.log("File uploaded successfully!");
        console.log("Image URL:", response.imageUrl);
        clipboardy.writeSync(response.imageUrl);
        console.log("Image URL copied to clipboard.");
    } catch (error) {
        console.error("Error uploading file:", (error as Error).message);
    }
}

/*

async function uploadFile() {
    const filePrompt = await inquirer.prompt([
        {
            type: "input",
            name: "pathToFile",
            message: "Please input the path to the file you want to upload:",
        },
    ]);

    const filePath = filePrompt.pathToFile;

    try {
        const response = await upload(filePath, authKey);

        const uploads = JsonUtil.readUploads() || { uploads: [] };
        uploads.uploads.push({ filename: filePath, deletionUrl: response.deletionUrl });
        JsonUtil.createUploads(uploads);

        console.log("File uploaded successfully!");
        console.log("Image URL:", response.imageUrl);
        clipboardy.writeSync(response.imageUrl);
        console.log("Image URL copied to clipboard.");
    } catch (error) {
        console.error("Error uploading file:", (error as Error).message);
    }
}

*/

async function deleteFile() {
    const uploads = JsonUtil.readUploads();

    if (uploads && uploads.uploads.length > 0) {
        const choices = uploads.uploads.map((upload) => upload.filename);

        const deletionPrompt = await inquirer.prompt([
            {
                type: "list",
                name: "selectedFile",
                message: "Please select the file you want to delete:",
                choices,
            },
        ]);

        const selectedFile = deletionPrompt.selectedFile;

        const deletionUrl = uploads.uploads.find((upload) => upload.filename === selectedFile)?.deletionUrl;

        if (deletionUrl) {
            remove(deletionUrl, selectedFile);
            JsonUtil.deleteUploadedFile(selectedFile);
        }
        else {
            console.log(`Error deleting file: ${selectedFile}`);
        }
    }
    else {
        console.log("No files to delete.");
    }
}

async function createURL() {
    let urlPrompt = await inquirer.prompt([
        {
            type: "input",
            name: "url",
            message: "Please input the URL you want to shorten:",
        },
    ]);

    const url = urlPrompt.url;

    try {
        const response = await createShort(url, authKey);

        if (response.success) {
            console.log("Shortened URL:", response.shortUrl);
            console.log("Deletion URL:", response.deletionUrl);
        } else {
            console.error("Error creating URL:", response.error);
        }
    } catch (error) {
        console.error(`Error creating URL: ${(error as Error).message}`);
    }
}

async function deleteURL() {
    let urlPrompt = await inquirer.prompt([
        {
            type: "input",
            name: "url",
            message: "Please input the URL you want to delete:",
        },
    ]);
    console.log(urlPrompt.url);
}

main().catch((error) => {
    console.error("An error occurred:", error);
});