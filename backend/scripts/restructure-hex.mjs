import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modulesRoot = path.resolve(__dirname, "../src/modules");

function walk(dir, acc = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, acc);
        else acc.push(full);
    }
    return acc;
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function moveFile(from, to) {
    ensureDir(path.dirname(to));
    fs.renameSync(from, to);
}

function rewriteApplication(content) {
    return content
        .replaceAll("../repository/", "../infrastructure/persistence/")
        .replaceAll("../validation/", "../infrastructure/http/validation/")
        .replace(/(\.\.\/\.\.\/[a-z0-9-]+)\/repository\//g, "$1/infrastructure/persistence/")
        .replace(/(\.\.\/\.\.\/[a-z0-9-]+)\/service\//g, "$1/application/");
}

function rewritePersistence(content) {
    return content
        .replaceAll("../../../config/", "../../../../config/")
        .replace(/from "\.\.\/\.\.\/([a-z0-9-]+)\/repository\//g, 'from "../../../$1/infrastructure/persistence/');
}

function rewriteHttp(content) {
    return content
        .replaceAll("../service/", "../../application/")
        .replaceAll("../repository/", "../persistence/")
        .replaceAll("../controller/", "./")
        .replaceAll("../validation/", "./validation/")
        .replaceAll("../middlewares/", "./middlewares/")
        .replaceAll("../../../middlewares/", "../../../../middlewares/")
        .replaceAll("../../../config/", "../../../../config/")
        .replaceAll("../../../types/", "../../../../types/")
        .replace(/from "\.\.\/\.\.\/([a-z0-9-]+)\/repository\//g, 'from "../../../$1/infrastructure/persistence/')
        .replace(/from "\.\.\/\.\.\/([a-z0-9-]+)\/service\//g, 'from "../../../$1/application/')
        .replace(/from "\.\.\/\.\.\/([a-z0-9-]+)\/infrastructure\/persistence\//g, 'from "../../../$1/infrastructure/persistence/')
        .replace(/from "\.\.\/\.\.\/([a-z0-9-]+)\/application\//g, 'from "../../../$1/application/');
}

function rewriteHttpValidation(content) {
    return content
        .replaceAll("../repository/", "../../persistence/")
        .replaceAll("../service/", "../../../application/");
}

function rewriteHttpMiddleware(content) {
    return content.replaceAll("../../../config/", "../../../../config/");
}

const modules = fs.readdirSync(modulesRoot).filter((name) => fs.statSync(path.join(modulesRoot, name)).isDirectory());

for (const mod of modules) {
    const root = path.join(modulesRoot, mod);
    const application = path.join(root, "application");
    const persistence = path.join(root, "infrastructure", "persistence");
    const http = path.join(root, "infrastructure", "http");
    const httpValidation = path.join(http, "validation");
    const httpMiddlewares = path.join(http, "middlewares");
    const domain = path.join(root, "domain");

    const serviceDir = path.join(root, "service");
    if (fs.existsSync(serviceDir)) {
        for (const file of fs.readdirSync(serviceDir)) {
            const from = path.join(serviceDir, file);
            const to = path.join(application, file);
            let content = fs.readFileSync(from, "utf8");
            content = rewriteApplication(content);
            ensureDir(application);
            fs.writeFileSync(to, content);
            fs.unlinkSync(from);
        }
        fs.rmdirSync(serviceDir);
    }

    const repoDir = path.join(root, "repository");
    if (fs.existsSync(repoDir)) {
        for (const file of fs.readdirSync(repoDir)) {
            const from = path.join(repoDir, file);
            const to = path.join(persistence, file);
            let content = fs.readFileSync(from, "utf8");
            content = rewritePersistence(content);
            ensureDir(persistence);
            fs.writeFileSync(to, content);
            fs.unlinkSync(from);
        }
        fs.rmdirSync(repoDir);
    }

    const controllerDir = path.join(root, "controller");
    if (fs.existsSync(controllerDir)) {
        for (const file of fs.readdirSync(controllerDir)) {
            const from = path.join(controllerDir, file);
            const to = path.join(http, file);
            let content = fs.readFileSync(from, "utf8");
            content = rewriteHttp(content);
            ensureDir(http);
            fs.writeFileSync(to, content);
            fs.unlinkSync(from);
        }
        fs.rmdirSync(controllerDir);
    }

    const routesDir = path.join(root, "routes");
    if (fs.existsSync(routesDir)) {
        for (const file of fs.readdirSync(routesDir)) {
            const from = path.join(routesDir, file);
            const to = path.join(http, file);
            let content = fs.readFileSync(from, "utf8");
            content = rewriteHttp(content);
            ensureDir(http);
            fs.writeFileSync(to, content);
            fs.unlinkSync(from);
        }
        fs.rmdirSync(routesDir);
    }

    const validationDir = path.join(root, "validation");
    if (fs.existsSync(validationDir)) {
        for (const file of fs.readdirSync(validationDir)) {
            const from = path.join(validationDir, file);
            const to = path.join(httpValidation, file);
            let content = fs.readFileSync(from, "utf8");
            content = rewriteHttpValidation(content);
            ensureDir(httpValidation);
            fs.writeFileSync(to, content);
            fs.unlinkSync(from);
        }
        fs.rmdirSync(validationDir);
    }

    const mwDir = path.join(root, "middlewares");
    if (fs.existsSync(mwDir)) {
        for (const file of fs.readdirSync(mwDir)) {
            const from = path.join(mwDir, file);
            const to = path.join(httpMiddlewares, file);
            let content = fs.readFileSync(from, "utf8");
            content = rewriteHttpMiddleware(content);
            ensureDir(httpMiddlewares);
            fs.writeFileSync(to, content);
            fs.unlinkSync(from);
        }
        fs.rmdirSync(mwDir);
    }

    ensureDir(domain);
    fs.writeFileSync(
        path.join(domain, "index.ts"),
        `/** Puerto de entrada del contexto ${mod}: la aplicación no depende de Express ni TypeORM. */\nexport {};\n`,
    );
}

console.log("Module folders restructured.");
