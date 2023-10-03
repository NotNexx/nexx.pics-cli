import inquirer from "inquirer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import clipboardy from "clipboardy";


const configPath = "config.json";
const uploadsPath = "uploads.json";

function readConfig(): { authKey: string } | null {
    try {
        const configData = fs.readFileSync(configPath, "utf8");
        return JSON.parse(configData);
    } catch (error) {
        return null;
    }
}

function writeConfig(config: { authKey: string }) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function createUploads(uploads: { uploads: { filename: string, deletionUrl: string }[] }) {
    fs.writeFileSync(uploadsPath, JSON.stringify(uploads, null, 2));
}

function deleteUploadedFile(filename: string) {
    const uploads = readUploads();
    if (uploads) {
        const newUploads = uploads.uploads.filter((upload) => upload.filename !== filename);
        createUploads({ uploads: newUploads });
    }
}

function readUploads(): { uploads: { filename: string, deletionUrl: string }[] } | null {
    try {
        const uploadsData = fs.readFileSync(uploadsPath, "utf8");
        return JSON.parse(uploadsData);
    } catch (error) {
        return null;
    }
}

let config = readConfig();
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

    writeConfig({ authKey });
}


async function main() {
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
                    "Create URL shortener",
                    "Delete URL shortener",
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
            case "Create URL shortener":
                await createURL();
                break;
            case "Delete URL shortener":
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
    const filePrompt = await inquirer.prompt([
        {
            type: "input",
            name: "pathToFile",
            message: "Please input the path to the file you want to upload:",
        },
    ]);

    const filePath = filePrompt.pathToFile;

    try {
        const fileData = fs.readFileSync(filePath);

        const formData = new FormData();
        formData.append("file", fileData, {
            filename: filePath,
        });

        const response = await axios.post("https://api.nexx.pics/files", formData, {
            headers: {
                ...formData.getHeaders(),
                key: authKey,
            },
        });

        const uploads = readUploads() || { uploads: [] };
        uploads.uploads.push({ filename: filePath, deletionUrl: response.data.deletionUrl });
        createUploads(uploads);


        console.log("File uploaded successfully!");
        console.log("Image URL:", response.data.imageUrl);
        clipboardy.writeSync(response.data.imageUrl);
        console.log("Image URL copied to clipboard.");
    } catch (error) {
        console.error("Error uploading file:", (error as Error).message);
    }
}

async function deleteFile() {
    const uploads = readUploads();

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

        const response = await axios.get(deletionUrl as string)
        if (response.status === 200) {
            console.log(`Deleted file: ${selectedFile}`);
            deleteUploadedFile(selectedFile);
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
    console.log(urlPrompt.url);
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