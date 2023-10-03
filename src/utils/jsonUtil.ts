import fs from "fs";

const configPath = "config.json";
const uploadsPath = "uploads.json";

class JsonUtil {
    static readConfig(): { authKey: string } | null {
        try {
            const configData = fs.readFileSync(configPath, "utf8");
            return JSON.parse(configData);
        } catch (error) {
            return null;
        }
    }

    static writeConfig(config: { authKey: string }) {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    static createUploads(uploads: { uploads: { filename: string, deletionUrl: string }[] }) {
        fs.writeFileSync(uploadsPath, JSON.stringify(uploads, null, 2));
    }

    static deleteUploadedFile(filename: string) {
        const uploads = JsonUtil.readUploads();
        if (uploads) {
            const newUploads = uploads.uploads.filter((upload) => upload.filename !== filename);
            JsonUtil.createUploads({ uploads: newUploads });
        }
    }

    static readUploads(): { uploads: { filename: string, deletionUrl: string }[] } | null {
        try {
            const uploadsData = fs.readFileSync(uploadsPath, "utf8");
            return JSON.parse(uploadsData);
        } catch (error) {
            return null;
        }
    }

    static writeUrls(urls: { urls: { url: string, shortUrl: string }[] }) {
        fs.writeFileSync(uploadsPath, JSON.stringify(urls, null, 2));
    }

    static readUrls(): { urls: { url: string, shortUrl: string }[] } | null {
        try {
            const urlsData = fs.readFileSync(uploadsPath, "utf8");
            return JSON.parse(urlsData);
        } catch (error) {
            return null;
        }
    }

    static deleteUrl(urlToDelete: string) {
        const urls = JsonUtil.readUrls();
        if (urls) {
            const newUrls = urls.urls.filter((url) => url.url !== urlToDelete);
            JsonUtil.writeUrls({ urls: newUrls });
        }
    }
    
}

export default JsonUtil;
