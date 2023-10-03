import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export interface UploadResponse {
    imageUrl: string;
    deletionUrl: string; 
}

export interface ShortenResponse {
    success: boolean;
    shortUrl: string;
    deletionUrl: string;
    error?: string;
}

export async function upload(filePath: string, authKey: string): Promise<UploadResponse> {
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

        return response.data;
    } catch (error) {
        throw new Error(`Error uploading file: ${(error as Error).message}`);
    }
}

export async function remove(deletionUrl: string, selectedFile: string) {
    try {
        const response = await axios.get(deletionUrl);
        if (response.status === 200) {
            console.log(`Deleted file: ${selectedFile}`);
        } else {
            console.log(`Error deleting file: ${selectedFile}`);
        }
    } catch (error) {
        console.error(`Error deleting file: ${(error as Error).message}`);
    }
}

export async function createShort(url: string, authKey: string): Promise<ShortenResponse> {
    try {
        const response = await axios.post("https://api.nexx.pics/shortener", { url }, {
            headers: {
                key: authKey,
            }
        });

        if (response.data.success) {
            console.log("URL created successfully!");
            console.log("Short URL:", response.data.shortUrl);
            console.log("Deletion URL:", response.data.deletionUrl);
        } else {
            console.log("Error creating URL:", response.data.message);
        }

        return response.data;
    } catch (error) {
        console.error(`Error creating URL: ${(error as Error).message}`);
        throw error;
    }
}