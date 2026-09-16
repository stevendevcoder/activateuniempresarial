import http from "http";
import app from "./app";
import envs from "./config/environment-vars";
import { connectDB } from "./config/data-base";

const PORT = Number(envs.PORT);

(async (): Promise<void> => {
    try {
        await connectDB();
        const server = http.createServer(app);
        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.log("Error al iniciar la aplicación", error);
        process.exit(1);
    }
})();